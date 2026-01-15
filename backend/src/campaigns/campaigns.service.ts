import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { TagsService } from '../tags/tags.service';
import { EmailService } from '../email/email.service';
import { CreateCampaignDto, UpdateCampaignDto } from './dto/campaign.dto';
import { CampaignStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    private prisma: PrismaService,
    private tagsService: TagsService,
    private emailService: EmailService,
    private configService: ConfigService,
    @InjectQueue('email') private emailQueue: Queue,
  ) {}

  async create(userId: string, dto: CreateCampaignDto) {
    // Verify tags exist and belong to user
    const contacts = await this.tagsService.getContactsByTags(userId, dto.tagIds);

    if (contacts.length === 0) {
      throw new BadRequestException('No subscribed contacts found for selected tags');
    }

    // Verify template if provided
    let templateId: string | null = null;
    if (dto.templateId && dto.templateId.trim() !== '') {
      const template = await this.prisma.emailTemplate.findFirst({
        where: { id: dto.templateId, userId },
      });
      if (!template) {
        throw new BadRequestException('Invalid template ID');
      }
      templateId = dto.templateId;
    }

    // Create campaign
    const campaign = await this.prisma.campaign.create({
      data: {
        name: dto.name,
        subject: dto.subject,
        senderName: dto.senderName,
        senderEmail: dto.senderEmail,
        emailContent: dto.emailContent,
        templateId: templateId,
        status: CampaignStatus.DRAFT,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        userId,
        tags: {
          create: dto.tagIds.map((tagId) => ({ tagId })),
        },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Create recipient records
    await this.prisma.campaignRecipient.createMany({
      data: contacts.map((contact) => ({
        campaignId: campaign.id,
        contactId: contact.id,
        email: contact.email,
      })),
      skipDuplicates: true,
    });

    return this.findOne(userId, campaign.id);
  }

  async findAll(userId: string, query?: { status?: CampaignStatus }) {
    const where: any = { userId };

    if (query?.status) {
      where.status = query.status;
    }

    return this.prisma.campaign.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            recipients: true,
            events: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, userId },
      include: {
        template: true,
        tags: {
          include: {
            tag: true,
          },
        },
        recipients: {
          include: {
            contact: true,
          },
        },
        _count: {
          select: {
            recipients: true,
            events: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  async update(userId: string, id: string, dto: UpdateCampaignDto) {
    const campaign = await this.findOne(userId, id);

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException('Only draft campaigns can be edited');
    }

    // Verify template if provided
    let templateId: string | null | undefined = undefined;
    if (dto.templateId !== undefined) {
      if (dto.templateId && dto.templateId.trim() !== '') {
        const template = await this.prisma.emailTemplate.findFirst({
          where: { id: dto.templateId, userId },
        });
        if (!template) {
          throw new BadRequestException('Invalid template ID');
        }
        templateId = dto.templateId;
      } else {
        templateId = null;
      }
    }

    // Update tags if provided
    if (dto.tagIds) {
      await this.prisma.campaignTag.deleteMany({
        where: { campaignId: id },
      });

      await this.prisma.campaignTag.createMany({
        data: dto.tagIds.map((tagId) => ({ campaignId: id, tagId })),
      });

      // Update recipients
      await this.prisma.campaignRecipient.deleteMany({
        where: { campaignId: id },
      });

      const contacts = await this.tagsService.getContactsByTags(userId, dto.tagIds);
      await this.prisma.campaignRecipient.createMany({
        data: contacts.map((contact) => ({
          campaignId: id,
          contactId: contact.id,
          email: contact.email,
        })),
        skipDuplicates: true,
      });
    }

    return this.prisma.campaign.update({
      where: { id },
      data: {
        name: dto.name,
        subject: dto.subject,
        senderName: dto.senderName,
        senderEmail: dto.senderEmail,
        emailContent: dto.emailContent,
        templateId: templateId,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  async remove(userId: string, id: string) {
    const campaign = await this.findOne(userId, id);

    if (campaign.status === CampaignStatus.SENDING) {
      throw new BadRequestException('Cannot delete campaign while sending');
    }

    await this.prisma.campaign.delete({
      where: { id },
    });

    return { message: 'Campaign deleted successfully' };
  }

  async sendNow(userId: string, id: string) {
    const campaign = await this.findOne(userId, id);

    if (campaign.status === CampaignStatus.SENT || campaign.status === CampaignStatus.SENDING) {
      throw new BadRequestException('Campaign already sent or sending');
    }

    // Log campaign send started
    await this.logCampaignEvent(id, 'INFO', 'Campaign send initiated');
    this.logger.log(`Campaign ${id} send initiated by user ${userId}`);

    // Update status
    await this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.SENDING },
    });

    // Queue emails (async - don't await)
    this.queueCampaignEmails(campaign).catch((error) => {
      this.logger.error(`Failed to queue campaign ${id}: ${error.message}`, error.stack);
      this.logCampaignEvent(id, 'ERROR', `Failed to queue emails: ${error.message}`);
      // Mark campaign as failed
      this.prisma.campaign.update({
        where: { id },
        data: { status: CampaignStatus.FAILED },
      });
    });

    return { message: 'Campaign is being sent', campaignId: id };
  }

  async sendTest(userId: string, id: string, testEmail: string) {
    const campaign = await this.findOne(userId, id);
    const html = await this.renderEmailContent(campaign.emailContent, campaign.templateId);

    // Use sample contact data for test email personalization
    const sampleContactData = {
      firstName: 'John',
      lastName: 'Doe',
      email: testEmail,
    };

    await this.emailService.sendTestEmail(testEmail, campaign.subject, html, sampleContactData);

    return { message: 'Test email sent successfully' };
  }

  private async queueCampaignEmails(campaign: any) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: campaign.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const frontendUrl = this.configService.get('FRONTEND_URL');
      const html = await this.renderEmailContent(campaign.emailContent, campaign.templateId);

      // Check suppression list
      const suppressedEmails = await this.prisma.suppressionList.findMany({
        select: { email: true },
      });
      const suppressedSet = new Set(suppressedEmails.map((s) => s.email));

      // Get all recipients with contact data
      const recipients = await this.prisma.campaignRecipient.findMany({
        where: { 
          campaignId: campaign.id,
          sentAt: null, // Only unsent recipients
        },
        include: {
          contact: true, // Include contact data for personalization
        },
      });

      if (recipients.length === 0) {
        await this.logCampaignEvent(campaign.id, 'WARN', 'No recipients found for campaign');
        this.logger.warn(`Campaign ${campaign.id} has no recipients`);
        
        await this.prisma.campaign.update({
          where: { id: campaign.id },
          data: { 
            status: CampaignStatus.FAILED,
          },
        });
        return;
      }

      let queuedCount = 0;
      let suppressedCount = 0;

      // Log recipient count
      await this.logCampaignEvent(
        campaign.id, 
        'INFO', 
        `Found ${recipients.length} recipients. Starting to queue emails...`
      );
      this.logger.log(`Campaign ${campaign.id}: Queueing ${recipients.length} emails`);

      // Queue each recipient
      for (const recipient of recipients) {
        // Skip if suppressed
        if (suppressedSet.has(recipient.email)) {
          suppressedCount++;
          await this.logCampaignEvent(
            campaign.id,
            'INFO',
            `Skipped suppressed email: ${recipient.email}`
          );
          continue;
        }

        const unsubscribeUrl = `${frontendUrl}/unsubscribe?email=${encodeURIComponent(recipient.email)}&campaignId=${campaign.id}`;

        await this.emailQueue.add(
          'send-campaign-email',
          {
            campaignId: campaign.id,
            recipientId: recipient.id,
            email: recipient.email,
            subject: campaign.subject,
            html,
            senderName: campaign.senderName,
            senderEmail: campaign.senderEmail,
            unsubscribeUrl,
            companyAddress: user.companyAddress || '',
            contactData: {
              firstName: recipient.contact.firstName,
              lastName: recipient.contact.lastName,
              email: recipient.contact.email,
            },
          },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
          },
        );
        queuedCount++;
      }

      // Log queue completion
      await this.logCampaignEvent(
        campaign.id,
        'INFO',
        `Successfully queued ${queuedCount} emails (${suppressedCount} suppressed)`
      );
      this.logger.log(
        `Campaign ${campaign.id}: Queued ${queuedCount} emails, skipped ${suppressedCount} suppressed`
      );

      // Note: Status will be updated to SENT by a background job checking completion
      // For now, keep it as SENDING until all emails are processed
      // We'll add a completion checker later
    } catch (error) {
      this.logger.error(`Error queueing campaign ${campaign.id}:`, error.stack);
      await this.logCampaignEvent(
        campaign.id,
        'ERROR',
        `Error queueing emails: ${error.message}`,
        { error: error.message, stack: error.stack }
      );
      throw error;
    }
  }

  private async logCampaignEvent(
    campaignId: string,
    level: string,
    message: string,
    metadata?: any
  ) {
    try {
      await this.prisma.campaignLog.create({
        data: {
          campaignId,
          level,
          message,
          metadata: metadata || {},
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log campaign event: ${error.message}`);
    }
  }

  private async renderEmailContent(content: any, templateId?: string): Promise<string> {
    if (!content) {
      return '<p>Empty email content</p>';
    }

    // If a template is specified, use it
    if (templateId) {
      const template = await this.prisma.emailTemplate.findUnique({
        where: { id: templateId },
      });

      if (template) {
        return this.applyContentToTemplate(template.htmlContent, content);
      }
    }

    // Support both old block-based format and new header/body/footer format
    if (content.blocks) {
      // Old format - backward compatibility
      return this.renderBlocks(content.blocks);
    }

    // New format with header, body, footer
    const port = this.configService.get('PORT') || 3000;
    const baseUrl = `http://localhost:${port}`;
    let html = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">';

    // Header section
    if (content.header) {
      html += '<div style="padding: 20px; background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">';
      if (content.header.logo) {
        const logoUrl = content.header.logo.startsWith('http') ? content.header.logo : `${baseUrl}${content.header.logo}`;
        html += `<img src="${logoUrl}" alt="Logo" style="max-height: 60px; margin-bottom: 10px;" />`;
      }
      if (content.header.title) {
        html += `<h1 style="margin: 0; font-size: 24px; color: #1f2937;">${content.header.title}</h1>`;
      }
      if (content.header.navigation && content.header.navigation.length > 0) {
        html += '<div style="margin-top: 10px;">';
        content.header.navigation.forEach((nav: any) => {
          html += `<a href="${nav.url}" style="margin-right: 15px; color: #4F46E5; text-decoration: none; font-size: 14px;">${nav.text}</a>`;
        });
        html += '</div>';
      }
      html += '</div>';
    }

    // Body section with blocks
    if (content.body && content.body.blocks) {
      html += '<div style="padding: 30px 20px;">';
      html += this.renderBlocks(content.body.blocks);
      html += '</div>';
    }

    // Footer section (mandatory)
    html += '<div style="padding: 20px; background-color: #f9fafb; border-top: 2px solid #e5e7eb; font-size: 12px; color: #6b7280;">';
    
    if (content.footer) {
      if (content.footer.companyInfo) {
        html += `<p style="margin: 5px 0;">${content.footer.companyInfo}</p>`;
      }
      if (content.footer.socialLinks && content.footer.socialLinks.length > 0) {
        html += '<div style="margin: 15px 0;">';
        content.footer.socialLinks.forEach((social: any) => {
          html += `<a href="${social.url}" style="margin-right: 10px; color: #4F46E5; text-decoration: none;">${social.platform}</a>`;
        });
        html += '</div>';
      }
    }

    // Add unsubscribe link placeholder
    html += '<p style="margin: 5px 0;">{{UNSUBSCRIBE_LINK}}</p>';
    html += '</div>';
    html += '</div>';

    return html;
  }

  private applyContentToTemplate(templateHtml: string, content: any): string {
    let html = templateHtml;

    // Replace template placeholders with content
    // Header replacements
    if (content.header) {
      html = html.replace('{{HEADER_TITLE}}', content.header.title || '');
      html = html.replace('{{LOGO_URL}}', content.header.logo || '');
    }

    // For promotional templates
    if (content.offer) {
      html = html.replace('{{OFFER_TITLE}}', content.offer.title || '');
      html = html.replace('{{OFFER_SUBTITLE}}', content.offer.subtitle || '');
    }

    // For announcement templates
    if (content.announcement) {
      html = html.replace('{{ANNOUNCEMENT_TITLE}}', content.announcement.title || '');
    }

    // Render content blocks into the template
    const contentHtml = content.body && content.body.blocks 
      ? this.renderBlocks(content.body.blocks)
      : this.renderBlocks(content.blocks || []);
    
    html = html.replace('{{CONTENT}}', contentHtml);

    // Footer replacements
    if (content.footer) {
      html = html.replace('{{COMPANY_INFO}}', content.footer.companyInfo || '');
      
      if (content.footer.socialLinks && content.footer.socialLinks.length > 0) {
        const socialHtml = content.footer.socialLinks.map((social: any) => 
          `<a href="${social.url}" style="margin-right: 10px; color: #4F46E5; text-decoration: none;">${social.platform}</a>`
        ).join('');
        html = html.replace('{{SOCIAL_LINKS}}', socialHtml);
      }
    }

    // Unsubscribe link placeholder will be replaced by email service
    // html = html.replace('{{UNSUBSCRIBE_LINK}}', ''); // Removed - let email service handle it

    return html;
  }

  private renderBlocks(blocks: any[]): string {
    let html = '';
    const port = this.configService.get('PORT') || 3000;
    const baseUrl = `http://localhost:${port}`;

    for (const block of blocks) {
      switch (block.type) {
        case 'text':
        case 'richText':
          html += `<div style="margin: 16px 0; line-height: 1.6; color: #374151;">${block.data.text || block.data.html || ''}</div>`;
          break;
        case 'heading':
          const level = block.data.level || 2;
          const size = level === 1 ? '28px' : level === 2 ? '24px' : '20px';
          html += `<h${level} style="margin: 24px 0 16px; color: #1f2937; font-size: ${size};">${block.data.text}</h${level}>`;
          break;
        case 'image':
          const imageUrl = block.data.url || '';
          const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`;
          html += `<div style="margin: 20px 0;"><img src="${fullImageUrl}" alt="${block.data.alt || ''}" style="max-width: 100%; height: auto; border-radius: 8px;" /></div>`;
          break;
        case 'button':
          const bgColor = block.data.backgroundColor || '#4F46E5';
          const textColor = block.data.textColor || '#ffffff';
          html += `<div style="margin: 24px 0; text-align: ${block.data.alignment || 'left'};"><a href="${block.data.url}" style="display: inline-block; padding: 12px 24px; background-color: ${bgColor}; color: ${textColor}; text-decoration: none; border-radius: 6px; font-weight: 600;">${block.data.text}</a></div>`;
          break;
        case 'divider':
          html += '<hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />';
          break;
        case 'spacer':
          const height = block.data.height || 20;
          html += `<div style="height: ${height}px;"></div>`;
          break;
        case 'pdf':
        case 'file':
          html += `<div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-radius: 8px;"><a href="${block.data.url}" style="color: #4F46E5; text-decoration: none; font-weight: 600;">📎 ${block.data.name || 'Download File'}</a></div>`;
          break;
        case 'customHtml':
          html += block.data.html || '';
          break;
        default:
          break;
      }
    }

    return html;
  }

  async getAnalytics(userId: string, id: string) {
    const campaign = await this.findOne(userId, id);

    const totalRecipients = await this.prisma.campaignRecipient.count({
      where: { campaignId: id },
    });

    const sentCount = await this.prisma.campaignRecipient.count({
      where: { campaignId: id, sentAt: { not: null } },
    });

    const events = await this.prisma.emailEvent.groupBy({
      by: ['eventType'],
      where: { campaignId: id },
      _count: true,
    });

    const eventCounts = events.reduce((acc, event) => {
      acc[event.eventType] = event._count;
      return acc;
    }, {} as any);

    const delivered = eventCounts.DELIVERED || 0;
    const opened = eventCounts.OPENED || 0;
    const clicked = eventCounts.CLICKED || 0;
    const bounced = eventCounts.BOUNCED || 0;
    const unsubscribed = eventCounts.UNSUBSCRIBED || 0;

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        sentAt: campaign.sentAt,
      },
      metrics: {
        totalRecipients,
        sent: sentCount,
        delivered,
        opened,
        clicked,
        bounced,
        unsubscribed,
        openRate: delivered > 0 ? ((opened / delivered) * 100).toFixed(2) : '0.00',
        clickRate: delivered > 0 ? ((clicked / delivered) * 100).toFixed(2) : '0.00',
        bounceRate: sentCount > 0 ? ((bounced / sentCount) * 100).toFixed(2) : '0.00',
      },
    };
  }

  async getStats(userId: string) {
    const total = await this.prisma.campaign.count({
      where: { userId },
    });

    const sent = await this.prisma.campaign.count({
      where: { userId, status: CampaignStatus.SENT },
    });

    const draft = await this.prisma.campaign.count({
      where: { userId, status: CampaignStatus.DRAFT },
    });

    const scheduled = await this.prisma.campaign.count({
      where: { userId, status: CampaignStatus.SCHEDULED },
    });

    return {
      total,
      sent,
      draft,
      scheduled,
    };
  }

  async getLogs(userId: string, campaignId: string) {
    // Verify campaign ownership
    const campaign = await this.findOne(userId, campaignId);

    const logs = await this.prisma.campaignLog.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to last 100 logs
    });

    return logs;
  }

  getMergeTags() {
    return {
      availableTags: [
        { tag: '{Name}', description: 'Full name or email prefix if name not available', example: 'John Doe' },
        { tag: '{FirstName}', description: 'Contact\'s first name', example: 'John' },
        { tag: '{LastName}', description: 'Contact\'s last name', example: 'Doe' },
        { tag: '{Full Name}', description: 'First and last name combined', example: 'John Doe' },
        { tag: '{Email}', description: 'Contact\'s email address', example: 'john@example.com' },
        { tag: '{First Name}', description: 'Alternative format for first name', example: 'John' },
        { tag: '{Last Name}', description: 'Alternative format for last name', example: 'Doe' },
      ],
      usage: 'Use these tags in your email subject and content. They will be automatically replaced with contact data when sending.',
      example: {
        subject: 'Hello {FirstName}!',
        content: 'Dear {Name}, welcome to our newsletter...'
      }
    };
  }

  async previewCampaign(userId: string, id: string) {
    const campaign = await this.findOne(userId, id);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    // Get a sample contact for personalization
    const sampleContact = await this.prisma.contact.findFirst({
      where: { 
        userId,
        status: 'SUBSCRIBED',
      },
    });

    // Build HTML from emailContent JSON structure
    const html = this.buildEmailHtml(campaign.emailContent, user);

    // Personalize with sample data
    const contactData = sampleContact ? {
      firstName: sampleContact.firstName || 'John',
      lastName: sampleContact.lastName || 'Doe',
      email: sampleContact.email,
    } : {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    };

    const personalizedHtml = this.emailService.personalizeContent(html, contactData);
    const personalizedSubject = this.emailService.personalizeContent(campaign.subject, contactData);

    return {
      subject: personalizedSubject,
      html: personalizedHtml,
      sampleData: contactData,
    };
  }

  private buildEmailHtml(emailContent: any, user: any): string {
    const port = this.configService.get('PORT') || 3000;
    const baseUrl = `http://localhost:${port}`;
    const content = typeof emailContent === 'string' ? JSON.parse(emailContent) : emailContent;
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; }
          .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .email-header { padding: 30px; background-color: #4F46E5; color: #ffffff; }
          .email-header h1 { margin: 0; font-size: 24px; }
          .email-header nav { margin-top: 15px; }
          .email-header nav a { color: #ffffff; text-decoration: none; margin-right: 20px; }
          .email-body { padding: 30px; }
          .email-footer { padding: 20px 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
          .social-links a { display: inline-block; margin-right: 15px; color: #4F46E5; text-decoration: none; }
          .block { margin-bottom: 20px; }
          .block img { max-width: 100%; height: auto; display: block; }
          .block h1 { font-size: 32px; margin: 0; }
          .block h2 { font-size: 24px; margin: 0; }
          .block h3 { font-size: 20px; margin: 0; }
          .block-button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: #ffffff !important; text-decoration: none; border-radius: 6px; }
          .block-divider { border: 0; border-top: 2px solid #e5e7eb; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="email-container">
    `;

    // Header
    if (content.header) {
      html += '<div class="email-header">';
      if (content.header.logo) {
        html += `<img src="${content.header.logo}" alt="Logo" style="max-height: 50px; margin-bottom: 15px;">`;
      }
      if (content.header.title) {
        html += `<h1>${content.header.title}</h1>`;
      }
      if (content.header.navigation && content.header.navigation.length > 0) {
        html += '<nav>';
        content.header.navigation.forEach(link => {
          html += `<a href="${link.url}">${link.text}</a>`;
        });
        html += '</nav>';
      }
      html += '</div>';
    }

    // Body blocks
    html += '<div class="email-body">';
    if (content.body && content.body.blocks) {
      content.body.blocks.forEach(block => {
        html += '<div class="block">';
        switch (block.type) {
          case 'heading':
            const level = block.data.level || 2;
            html += `<h${level}>${block.data.text || ''}</h${level}>`;
            break;
          case 'text':
            html += `<p>${block.data.text || ''}</p>`;
            break;
          case 'image':
            const imageUrl = block.data.url || '';
            const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`;
            html += `<img src="${fullImageUrl}" alt="${block.data.alt || ''}" style="max-width: 100%; height: auto; border-radius: 8px;">`;
            break;
          case 'button':
            const bgColor = block.data.backgroundColor || '#4F46E5';
            const textColor = block.data.textColor || '#ffffff';
            html += `<a href="${block.data.url || '#'}" class="block-button" style="background-color: ${bgColor}; color: ${textColor} !important;">${block.data.text || 'Click here'}</a>`;
            break;
          case 'divider':
            html += '<hr class="block-divider">';
            break;
          case 'spacer':
            const height = block.data.height || 20;
            html += `<div style="height: ${height}px;"></div>`;
            break;
          case 'link':
            html += `<p><a href="${block.data.url || '#'}" style="color: #4F46E5; text-decoration: underline;">${block.data.text || 'Link'}</a></p>`;
            break;
          case 'file':
            html += `<p>📎 <a href="${block.data.url || '#'}" style="color: #4F46E5;">${block.data.name || 'Download file'}</a></p>`;
            break;
          case 'customHtml':
            html += block.data.html || '';
            break;
        }
        html += '</div>';
      });
    }
    html += '</div>';

    // Footer
    html += '<div class="email-footer">';
    if (content.footer) {
      if (content.footer.companyInfo) {
        html += `<p>${content.footer.companyInfo}</p>`;
      }
      if (content.footer.socialLinks && content.footer.socialLinks.length > 0) {
        html += '<div class="social-links">';
        content.footer.socialLinks.forEach(link => {
          html += `<a href="${link.url}">${link.platform}</a>`;
        });
        html += '</div>';
      }
    }
    
    // Unsubscribe link
    html += `
      <p style="margin-top: 20px;">
        <a href="{{UNSUBSCRIBE_LINK}}" style="color: #4F46E5;">Unsubscribe</a> from these emails
      </p>
      <p>${user.companyAddress || user.companyName || 'ViozonX Email Marketing'}</p>
    `;
    html += '</div>';

    html += `
        </div>
      </body>
      </html>
    `;

    return html;
  }

  async createDraft(userId: string, name?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    // Create a minimal draft campaign
    const campaign = await this.prisma.campaign.create({
      data: {
        name: name || `Draft - ${new Date().toLocaleDateString()}`,
        subject: '',
        senderName: user.senderName || user.companyName || 'ViozonX',
        senderEmail: user.senderEmail || user.email,
        emailContent: { blocks: [] },
        status: CampaignStatus.DRAFT,
        userId,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return campaign;
  }

  async autosave(userId: string, id: string, dto: UpdateCampaignDto) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, userId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Allow autosave for drafts and scheduled campaigns
    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.SCHEDULED) {
      throw new BadRequestException('Can only autosave draft or scheduled campaigns');
    }

    // Verify template if provided
    let templateId: string | null | undefined = undefined;
    if (dto.templateId !== undefined) {
      if (dto.templateId && dto.templateId.trim() !== '') {
        const template = await this.prisma.emailTemplate.findFirst({
          where: { id: dto.templateId, userId },
        });
        if (!template) {
          throw new BadRequestException('Invalid template ID');
        }
        templateId = dto.templateId;
      } else {
        templateId = null;
      }
    }

    // Update tags if provided
    if (dto.tagIds) {
      await this.prisma.campaignTag.deleteMany({
        where: { campaignId: id },
      });

      if (dto.tagIds.length > 0) {
        await this.prisma.campaignTag.createMany({
          data: dto.tagIds.map((tagId) => ({ campaignId: id, tagId })),
        });

        // Update recipients
        await this.prisma.campaignRecipient.deleteMany({
          where: { campaignId: id },
        });

        const contacts = await this.tagsService.getContactsByTags(userId, dto.tagIds);
        if (contacts.length > 0) {
          await this.prisma.campaignRecipient.createMany({
            data: contacts.map((contact) => ({
              campaignId: id,
              contactId: contact.id,
              email: contact.email,
            })),
            skipDuplicates: true,
          });
        }
      }
    }

    return this.prisma.campaign.update({
      where: { id },
      data: {
        name: dto.name,
        subject: dto.subject,
        senderName: dto.senderName,
        senderEmail: dto.senderEmail,
        emailContent: dto.emailContent,
        templateId: templateId,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }
}

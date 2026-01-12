import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateTemplateDto) {
    // If setting as default, unset all other defaults for this user
    if (dto.isDefault) {
      await this.prisma.emailTemplate.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.emailTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        htmlContent: dto.htmlContent,
        thumbnail: dto.thumbnail,
        isDefault: dto.isDefault || false,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.emailTemplate.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { updatedAt: 'desc' },
      ],
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
    });
  }

  async findOne(userId: string, id: string) {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return template;
  }

  async update(userId: string, id: string, dto: UpdateTemplateDto) {
    const template = await this.findOne(userId, id);

    // If setting as default, unset all other defaults for this user
    if (dto.isDefault) {
      await this.prisma.emailTemplate.updateMany({
        where: { userId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.emailTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        htmlContent: dto.htmlContent,
        thumbnail: dto.thumbnail,
        isDefault: dto.isDefault,
      },
    });
  }

  async remove(userId: string, id: string) {
    const template = await this.findOne(userId, id);

    // Check if template is being used by any campaigns
    const campaignCount = await this.prisma.campaign.count({
      where: { templateId: id },
    });

    if (campaignCount > 0) {
      throw new BadRequestException(
        `Cannot delete template that is used by ${campaignCount} campaign(s)`,
      );
    }

    await this.prisma.emailTemplate.delete({
      where: { id },
    });

    return { message: 'Template deleted successfully' };
  }

  async duplicate(userId: string, id: string) {
    const template = await this.findOne(userId, id);

    return this.prisma.emailTemplate.create({
      data: {
        name: `${template.name} (Copy)`,
        description: template.description,
        htmlContent: template.htmlContent,
        thumbnail: template.thumbnail,
        isDefault: false,
        userId,
      },
    });
  }

  async setDefault(userId: string, id: string) {
    const template = await this.findOne(userId, id);

    // Unset all other defaults
    await this.prisma.emailTemplate.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    // Set this template as default
    return this.prisma.emailTemplate.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  async getDefaultTemplates() {
    // Return a list of pre-built templates that users can start with
    return [
      {
        id: 'basic-newsletter',
        name: 'Basic Newsletter',
        description: 'Simple newsletter template with header, content area, and footer',
        thumbnail: '/templates/basic-newsletter.png',
        htmlContent: this.getBasicNewsletterTemplate(),
        isBuiltIn: true,
      },
      {
        id: 'promotional',
        name: 'Promotional Email',
        description: 'Eye-catching template for promotions and special offers',
        thumbnail: '/templates/promotional.png',
        htmlContent: this.getPromotionalTemplate(),
        isBuiltIn: true,
      },
      {
        id: 'announcement',
        name: 'Announcement',
        description: 'Clean template for important announcements',
        thumbnail: '/templates/announcement.png',
        htmlContent: this.getAnnouncementTemplate(),
        isBuiltIn: true,
      },
    ];
  }

  private getBasicNewsletterTemplate(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background-color: #4F46E5; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">{{HEADER_TITLE}}</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              {{CONTENT}}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 12px; color: #6b7280;">{{COMPANY_INFO}}</p>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">{{UNSUBSCRIBE_LINK}}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private getPromotionalTemplate(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Special Offer</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #1f2937;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <!-- Hero Section -->
          <tr>
            <td style="padding: 0;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 60px 40px; text-align: center;">
                <h1 style="margin: 0 0 20px; color: #ffffff; font-size: 36px; font-weight: bold;">{{OFFER_TITLE}}</h1>
                <p style="margin: 0; color: #ffffff; font-size: 20px;">{{OFFER_SUBTITLE}}</p>
              </div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px;">
              {{CONTENT}}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 12px; color: #6b7280;">{{COMPANY_INFO}}</p>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">{{UNSUBSCRIBE_LINK}}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private getAnnouncementTemplate(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Announcement</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 2px solid #e5e7eb;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px;">
              <h1 style="margin: 0; color: #1f2937; font-size: 32px; font-weight: 700;">{{ANNOUNCEMENT_TITLE}}</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 40px;">
              {{CONTENT}}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 12px; color: #6b7280;">{{COMPANY_INFO}}</p>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">{{UNSUBSCRIBE_LINK}}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}

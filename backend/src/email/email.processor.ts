import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { PrismaService } from '../prisma/prisma.service';
import { CampaignStatus } from '@prisma/client';

interface EmailJob {
  campaignId: string;
  recipientId: string;
  email: string;
  subject: string;
  html: string;
  senderName: string;
  senderEmail: string;
  unsubscribeUrl: string;
  companyAddress: string;
  contactData: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private emailService: EmailService,
    private prisma: PrismaService,
  ) {}

  @Process('send-campaign-email')
  async handleSendEmail(job: Job<EmailJob>) {
    const { campaignId, recipientId, email, subject, html, senderName, senderEmail, unsubscribeUrl, companyAddress, contactData } = job.data;

    this.logger.log(`Processing email for ${email} (campaign: ${campaignId})`);

    try {
      // Send email with contact data for personalization
      const result = await this.emailService.sendCampaignEmail(
        email,
        subject,
        html,
        senderName,
        senderEmail,
        unsubscribeUrl,
        companyAddress,
        {
          campaignId,
          recipientId,
          recipientEmail: email,
        },
        contactData,
      );

      this.logger.log(`Email sent successfully to ${email}, messageId: ${result.messageId}`);

      // Update recipient
      await this.prisma.campaignRecipient.update({
        where: { id: recipientId },
        data: { sentAt: new Date() },
      });

      // Log event
      await this.prisma.emailEvent.create({
        data: {
          campaignId,
          recipientEmail: email,
          eventType: 'SENT',
          metadata: { messageId: result.messageId },
        },
      });

      // Log to campaign logs
      await this.prisma.campaignLog.create({
        data: {
          campaignId,
          level: 'INFO',
          message: `Email sent to ${email}`,
          metadata: { messageId: result.messageId, recipientId },
        },
      });

      // Check if campaign is complete
      await this.checkCampaignCompletion(campaignId);

      return { success: true, messageId: result.messageId };
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}: ${error.message}`, error.stack);

      // Log failed event
      await this.prisma.emailEvent.create({
        data: {
          campaignId,
          recipientEmail: email,
          eventType: 'BOUNCED',
          metadata: { error: error.message },
        },
      });

      // Log to campaign logs
      await this.prisma.campaignLog.create({
        data: {
          campaignId,
          level: 'ERROR',
          message: `Failed to send email to ${email}`,
          metadata: { error: error.message, recipientId },
        },
      });

      throw error;
    }
  }

  private async checkCampaignCompletion(campaignId: string) {
    try {
      // Get total recipients and sent count
      const [totalRecipients, sentCount] = await Promise.all([
        this.prisma.campaignRecipient.count({
          where: { campaignId },
        }),
        this.prisma.campaignRecipient.count({
          where: { campaignId, sentAt: { not: null } },
        }),
      ]);

      // If all emails have been processed (sent or failed)
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId },
      });

      if (campaign && campaign.status === CampaignStatus.SENDING) {
        if (sentCount >= totalRecipients) {
          // Mark campaign as complete
          await this.prisma.campaign.update({
            where: { id: campaignId },
            data: {
              status: CampaignStatus.SENT,
              sentAt: new Date(),
            },
          });

          await this.prisma.campaignLog.create({
            data: {
              campaignId,
              level: 'INFO',
              message: `Campaign completed. ${sentCount}/${totalRecipients} emails sent.`,
              metadata: { totalRecipients, sentCount },
            },
          });

          this.logger.log(`Campaign ${campaignId} completed: ${sentCount}/${totalRecipients} emails sent`);
        }
      }
    } catch (error) {
      this.logger.error(`Error checking campaign completion: ${error.message}`);
    }
  }
}

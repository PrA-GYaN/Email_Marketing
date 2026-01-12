import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private prisma: PrismaService) {}

  @Get('open')
  async trackOpen(
    @Query('cid') campaignId: string,
    @Query('rid') recipientId: string,
    @Res() res: Response,
  ) {
    try {
      // Log open event
      await this.prisma.emailEvent.create({
        data: {
          campaignId,
          recipientEmail: '', // Will be populated from recipient lookup
          eventType: 'OPENED',
          metadata: { recipientId, trackedAt: new Date().toISOString() },
        },
      });

      // Get recipient email for the event
      const recipient = await this.prisma.campaignRecipient.findUnique({
        where: { id: recipientId },
      });

      if (recipient) {
        await this.prisma.emailEvent.updateMany({
          where: {
            campaignId,
            recipientEmail: '',
            eventType: 'OPENED',
            metadata: { path: ['recipientId'], equals: recipientId },
          },
          data: {
            recipientEmail: recipient.email,
          },
        });
      }

      this.logger.log(`Email opened - Campaign: ${campaignId}, Recipient: ${recipientId}`);

      // Return 1x1 transparent pixel
      res.set({
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      });

      // 1x1 transparent GIF
      const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.send(pixel);
    } catch (error) {
      this.logger.error(`Error tracking open: ${error.message}`);
      // Still return pixel even on error to avoid broken images
      res.set('Content-Type', 'image/gif');
      const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.send(pixel);
    }
  }

  @Get('click')
  async trackClick(
    @Query('cid') campaignId: string,
    @Query('rid') recipientId: string,
    @Query('url') targetUrl: string,
    @Res() res: Response,
  ) {
    try {
      // Log click event
      await this.prisma.emailEvent.create({
        data: {
          campaignId,
          recipientEmail: '', // Will be populated from recipient lookup
          eventType: 'CLICKED',
          metadata: { 
            recipientId, 
            targetUrl: decodeURIComponent(targetUrl),
            trackedAt: new Date().toISOString()
          },
        },
      });

      // Get recipient email for the event
      const recipient = await this.prisma.campaignRecipient.findUnique({
        where: { id: recipientId },
      });

      if (recipient) {
        await this.prisma.emailEvent.updateMany({
          where: {
            campaignId,
            recipientEmail: '',
            eventType: 'CLICKED',
            metadata: { path: ['recipientId'], equals: recipientId },
          },
          data: {
            recipientEmail: recipient.email,
          },
        });
      }

      this.logger.log(`Email clicked - Campaign: ${campaignId}, Recipient: ${recipientId}, URL: ${targetUrl}`);

      // Redirect to target URL
      res.redirect(decodeURIComponent(targetUrl));
    } catch (error) {
      this.logger.error(`Error tracking click: ${error.message}`);
      // Redirect anyway to avoid broken links
      res.redirect(decodeURIComponent(targetUrl));
    }
  }
}
import { Controller, Post, Body, Query, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private prisma: PrismaService) {}

  @Post('email-events')
  async handleEmailEvent(@Body() payload: any) {
    // Handle email provider webhooks (SendGrid, SES, etc.)
    // This is a generic handler - adapt based on your email provider

    try {
      const { event, email, campaignId, timestamp } = payload;

      // Map provider event to our event types
      let eventType: string;
      switch (event) {
        case 'delivered':
          eventType = 'DELIVERED';
          break;
        case 'open':
        case 'opened':
          eventType = 'OPENED';
          break;
        case 'click':
        case 'clicked':
          eventType = 'CLICKED';
          break;
        case 'bounce':
        case 'bounced':
          eventType = 'BOUNCED';
          break;
        case 'complaint':
        case 'complained':
          eventType = 'COMPLAINED';
          break;
        default:
          return { success: true };
      }

      // Create email event
      await this.prisma.emailEvent.create({
        data: {
          campaignId,
          recipientEmail: email,
          eventType: eventType as any,
          metadata: payload,
        },
      });

      // Add to suppression list if bounced or complained
      if (eventType === 'BOUNCED' || eventType === 'COMPLAINED') {
        await this.prisma.suppressionList.upsert({
          where: { email },
          create: {
            email,
            reason: eventType,
          },
          update: {},
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Webhook error:', error);
      return { success: false, error: error.message };
    }
  }
}

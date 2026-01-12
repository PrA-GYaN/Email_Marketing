import { Controller, Get, Post, Query, Render, Res } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Response } from 'express';

@Controller('unsubscribe')
export class UnsubscribeController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async unsubscribePage(@Query('email') email: string, @Query('campaignId') campaignId: string) {
    if (!email) {
      return { success: false, message: 'Email is required' };
    }

    // Unsubscribe contact
    const contacts = await this.prisma.contact.findMany({
      where: { email },
    });

    for (const contact of contacts) {
      await this.prisma.contact.update({
        where: { id: contact.id },
        data: { status: 'UNSUBSCRIBED' },
      });
    }

    // Add to suppression list
    await this.prisma.suppressionList.upsert({
      where: { email },
      create: { email, reason: 'User unsubscribed' },
      update: {},
    });

    // Log event if campaignId provided
    if (campaignId) {
      await this.prisma.emailEvent.create({
        data: {
          campaignId,
          recipientEmail: email,
          eventType: 'UNSUBSCRIBED',
        },
      });
    }

    return {
      success: true,
      message: 'You have been successfully unsubscribed from all future emails.',
    };
  }

  @Post()
  async unsubscribePost(@Query('email') email: string, @Query('campaignId') campaignId?: string) {
    return this.unsubscribePage(email, campaignId);
  }
}

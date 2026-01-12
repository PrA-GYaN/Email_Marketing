import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers(query?: { suspended?: boolean }) {
    const where: any = { role: 'USER' };

    if (query?.suspended !== undefined) {
      where.isSuspended = query.suspended;
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        companyName: true,
        isSuspended: true,
        isEmailVerified: true,
        createdAt: true,
        _count: {
          select: {
            contacts: true,
            campaigns: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => ({
      ...user,
      contactCount: user._count.contacts,
      campaignCount: user._count.campaigns,
    }));
  }

  async getUserDetails(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        companyName: true,
        senderName: true,
        senderEmail: true,
        companyAddress: true,
        isSuspended: true,
        isEmailVerified: true,
        createdAt: true,
        _count: {
          select: {
            contacts: true,
            campaigns: true,
            tags: true,
          },
        },
      },
    });

    // Get email usage stats
    const campaigns = await this.prisma.campaign.findMany({
      where: { userId, status: 'SENT' },
      select: {
        id: true,
        name: true,
        sentAt: true,
        _count: {
          select: {
            recipients: true,
          },
        },
      },
    });

    const totalEmailsSent = campaigns.reduce((sum, c) => sum + c._count.recipients, 0);

    return {
      ...user,
      contactCount: user._count.contacts,
      campaignCount: user._count.campaigns,
      tagCount: user._count.tags,
      totalEmailsSent,
      recentCampaigns: campaigns.slice(0, 5),
    };
  }

  async suspendUser(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isSuspended: true },
    });

    return { message: 'User suspended successfully' };
  }

  async unsuspendUser(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isSuspended: false },
    });

    return { message: 'User unsuspended successfully' };
  }

  async getSystemStats() {
    const totalUsers = await this.prisma.user.count({
      where: { role: 'USER' },
    });

    const activeUsers = await this.prisma.user.count({
      where: { role: 'USER', isSuspended: false },
    });

    const suspendedUsers = await this.prisma.user.count({
      where: { role: 'USER', isSuspended: true },
    });

    const totalContacts = await this.prisma.contact.count();

    const totalCampaigns = await this.prisma.campaign.count();

    const sentCampaigns = await this.prisma.campaign.count({
      where: { status: 'SENT' },
    });

    const totalEmailsSent = await this.prisma.emailEvent.count({
      where: { eventType: 'SENT' },
    });

    const recentEvents = await this.prisma.emailEvent.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        campaign: {
          select: {
            name: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers,
      },
      contacts: {
        total: totalContacts,
      },
      campaigns: {
        total: totalCampaigns,
        sent: sentCampaigns,
      },
      emails: {
        totalSent: totalEmailsSent,
      },
      recentEvents,
    };
  }

  async getEmailLogs(query?: { userId?: string; eventType?: string; limit?: number }) {
    const where: any = {};

    if (query?.userId) {
      where.campaign = {
        userId: query.userId,
      };
    }

    if (query?.eventType) {
      where.eventType = query.eventType;
    }

    return this.prisma.emailEvent.findMany({
      where,
      take: query?.limit || 50,
      orderBy: { createdAt: 'desc' },
      include: {
        campaign: {
          select: {
            name: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });
  }
}

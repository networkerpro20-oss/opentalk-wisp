import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview(organizationId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [
      totalContacts,
      newContacts,
      activeConversations,
      totalConversations,
      totalDeals,
      wonDeals,
    ] = await Promise.all([
      this.prisma.contact.count({ where: { organizationId } }),
      this.prisma.contact.count({
        where: { organizationId, createdAt: { gte: since } },
      }),
      this.prisma.conversation.count({
        where: { organizationId, status: { in: ['OPEN', 'PENDING'] } },
      }),
      this.prisma.conversation.count({
        where: { organizationId, createdAt: { gte: since } },
      }),
      this.prisma.deal.count({ where: { organizationId } }),
      this.prisma.deal.findMany({
        where: { organizationId, status: 'WON' },
        select: { value: true },
      }),
    ]);

    const totalRevenue = wonDeals.reduce(
      (sum, d) => sum + (d.value?.toNumber?.() ?? Number(d.value) ?? 0),
      0,
    );

    const openDeals = await this.prisma.deal.count({
      where: { organizationId, status: 'OPEN' },
    });

    const conversionRate =
      totalDeals > 0
        ? Math.round((wonDeals.length / totalDeals) * 100 * 10) / 10
        : 0;

    return {
      totalContacts,
      newContacts,
      activeConversations,
      totalConversations,
      totalDeals,
      openDeals,
      wonDeals: wonDeals.length,
      totalRevenue,
      conversionRate,
    };
  }

  async getConversationsByDay(organizationId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const conversations = await this.prisma.conversation.findMany({
      where: { organizationId, createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const byDay = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toISOString().split('T')[0];
      byDay.set(key, 0);
    }

    for (const conv of conversations) {
      const key = conv.createdAt.toISOString().split('T')[0];
      byDay.set(key, (byDay.get(key) || 0) + 1);
    }

    return Array.from(byDay.entries()).map(([date, conversations]) => ({
      date,
      conversations,
    }));
  }

  async getDealsByStage(organizationId: string) {
    const stages = await this.prisma.stage.findMany({
      where: { pipeline: { organizationId } },
      include: {
        deals: {
          where: { organizationId },
          select: { value: true },
        },
        pipeline: { select: { name: true } },
      },
      orderBy: { order: 'asc' },
    });

    return stages.map((stage) => ({
      stage: stage.name,
      pipeline: stage.pipeline.name,
      deals: stage.deals.length,
      value: stage.deals.reduce(
        (sum, d) => sum + (d.value?.toNumber?.() ?? Number(d.value) ?? 0),
        0,
      ),
    }));
  }

  async getTopAgents(organizationId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const users = await this.prisma.user.findMany({
      where: { organizationId, role: { in: ['AGENT', 'ADMIN', 'OWNER'] } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        _count: {
          select: {
            assignedConversations: true,
          },
        },
      },
    });

    // Get deal counts and revenue per user
    const result = await Promise.all(
      users.map(async (user) => {
        const deals = await this.prisma.deal.findMany({
          where: { organizationId, assignedToId: user.id, status: 'WON' },
          select: { value: true },
        });

        return {
          name: `${user.firstName} ${user.lastName}`,
          conversations: user._count.assignedConversations,
          deals: deals.length,
          revenue: deals.reduce(
            (sum, d) =>
              sum + (d.value?.toNumber?.() ?? Number(d.value) ?? 0),
            0,
          ),
        };
      }),
    );

    return result.sort((a, b) => b.conversations - a.conversations);
  }

  async getChannelDistribution(organizationId: string) {
    const conversations = await this.prisma.conversation.groupBy({
      by: ['channel'],
      where: { organizationId },
      _count: { id: true },
    });

    return conversations.map((c) => ({
      name: c.channel,
      value: c._count.id,
    }));
  }
}

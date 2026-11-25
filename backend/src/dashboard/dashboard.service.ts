import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DealStage, TaskStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getKpis() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalContacts,
      totalCompanies,
      totalLeads,
      openDeals,
      wonDeals,
      totalRevenue,
      pendingTasks,
      recentActivities,
    ] = await this.prisma.$transaction([
      this.prisma.contact.count(),
      this.prisma.company.count(),
      this.prisma.lead.count({ where: { status: { not: 'CONVERTED' } } }),
      this.prisma.deal.count({ where: { stage: { notIn: [DealStage.CLOSED_WON, DealStage.CLOSED_LOST] } } }),
      this.prisma.deal.count({ where: { stage: DealStage.CLOSED_WON } }),
      this.prisma.deal.aggregate({ where: { stage: DealStage.CLOSED_WON }, _sum: { value: true } }),
      this.prisma.task.count({ where: { status: TaskStatus.PENDING } }),
      this.prisma.activity.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    ]);

    return {
      totalContacts,
      totalCompanies,
      totalLeads,
      openDeals,
      wonDeals,
      totalRevenue: totalRevenue._sum.value || 0,
      pendingTasks,
      recentActivities,
    };
  }

  async getPipelineSummary() {
    const stages = Object.values(DealStage);
    const summary = await Promise.all(
      stages.map(async (stage) => {
        const [count, agg] = await this.prisma.$transaction([
          this.prisma.deal.count({ where: { stage } }),
          this.prisma.deal.aggregate({ where: { stage }, _sum: { value: true } }),
        ]);
        return { stage, count, totalValue: agg._sum.value || 0 };
      }),
    );
    return summary;
  }

  async getRecentActivity() {
    return this.prisma.activity.findMany({
      take: 10,
      orderBy: { occurredAt: 'desc' },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async getUpcomingTasks() {
    return this.prisma.task.findMany({
      where: { status: TaskStatus.PENDING, dueDate: { gte: new Date() } },
      take: 10,
      orderBy: { dueDate: 'asc' },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }
}

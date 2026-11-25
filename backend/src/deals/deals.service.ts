import { Injectable, NotFoundException } from '@nestjs/common';
import { DealStage } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { FilterDealsDto } from './dto/filter-deals.dto';

const INCLUDE = {
  contact: { select: { id: true, firstName: true, lastName: true, email: true } },
  company: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, firstName: true, lastName: true } },
};

@Injectable()
export class DealsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateDealDto) {
    return this.prisma.deal.create({ data: dto, include: INCLUDE });
  }

  async findAll(dto: FilterDealsDto) {
    const { page = 1, limit = 20, search, stage, assignedToId, contactId, companyId } = dto;
    const where: any = {};
    if (stage) where.stage = stage;
    if (assignedToId) where.assignedToId = assignedToId;
    if (contactId) where.contactId = contactId;
    if (companyId) where.companyId = companyId;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.deal.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: INCLUDE,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.deal.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  /** Kanban board: every stage as a key, deals grouped under it. */
  async getPipelineBoard(assignedToId?: string) {
    const deals = await this.prisma.deal.findMany({
      where: assignedToId ? { assignedToId } : {},
      include: INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });
    const board = Object.fromEntries(Object.values(DealStage).map((s) => [s, [] as typeof deals]));
    for (const deal of deals) board[deal.stage].push(deal);
    return board;
  }

  async findOne(id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        ...INCLUDE,
        activities: { orderBy: { occurredAt: 'desc' }, take: 20 },
        tasks: { orderBy: { dueDate: 'asc' } },
      },
    });
    if (!deal) throw new NotFoundException('Deal not found');
    return deal;
  }

  async update(id: string, dto: UpdateDealDto) {
    await this.findOne(id);
    return this.prisma.deal.update({ where: { id }, data: dto, include: INCLUDE });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      await tx.activity.updateMany({ where: { dealId: id }, data: { dealId: null } });
      await tx.task.updateMany({ where: { dealId: id }, data: { dealId: null } });
      return tx.deal.delete({ where: { id } });
    });
  }
}

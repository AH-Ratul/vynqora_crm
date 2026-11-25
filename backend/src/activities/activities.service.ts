import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { FilterActivitiesDto } from './dto/filter-activities.dto';

const INCLUDE = {
  contact: { select: { id: true, firstName: true, lastName: true } },
  deal: { select: { id: true, title: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
};

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateActivityDto, userId: string) {
    return this.prisma.activity.create({
      data: { ...dto, createdById: userId },
      include: INCLUDE,
    });
  }

  async findAll(dto: FilterActivitiesDto) {
    const { page = 1, limit = 20, search, contactId, dealId, type } = dto;
    const where: any = {};
    if (contactId) where.contactId = contactId;
    if (dealId) where.dealId = dealId;
    if (type) where.type = type;
    if (search) where.subject = { contains: search, mode: 'insensitive' };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.activity.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: INCLUDE,
        orderBy: { occurredAt: 'desc' },
      }),
      this.prisma.activity.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async remove(id: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    if (!activity) throw new NotFoundException('Activity not found');
    return this.prisma.activity.delete({ where: { id } });
  }
}

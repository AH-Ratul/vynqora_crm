import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LeadStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { FilterLeadsDto } from './dto/filter-leads.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';

const INCLUDE = {
  contact: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      companyId: true,
      company: { select: { id: true, name: true } },
    },
  },
  assignedTo: { select: { id: true, firstName: true, lastName: true } },
};

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateLeadDto) {
    return this.prisma.lead.create({ data: dto, include: INCLUDE });
  }

  async findAll(dto: FilterLeadsDto) {
    const { page = 1, limit = 20, search, status, assignedToId } = dto;
    const where: any = {};
    if (status) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;
    if (search) {
      where.contact = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: INCLUDE,
        orderBy: [{ createdAt: 'desc' }],
      }),
      this.prisma.lead.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: { ...INCLUDE, deal: true },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async update(id: string, dto: UpdateLeadDto) {
    await this.findOne(id);
    return this.prisma.lead.update({ where: { id }, data: dto, include: INCLUDE });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.lead.delete({ where: { id } });
  }

  /** Converts a lead into a deal and marks the lead as CONVERTED. */
  async convert(id: string, dto: ConvertLeadDto) {
    const lead = await this.findOne(id);
    if (lead.deal || lead.status === LeadStatus.CONVERTED) {
      throw new BadRequestException('Lead is already converted');
    }

    return this.prisma.$transaction(async (tx) => {
      const deal = await tx.deal.create({
        data: {
          ...dto,
          contactId: lead.contactId,
          companyId: lead.contact.companyId ?? undefined,
          assignedToId: lead.assignedToId ?? undefined,
          leadId: lead.id,
        },
      });
      await tx.lead.update({ where: { id }, data: { status: LeadStatus.CONVERTED } });
      return deal;
    });
  }
}

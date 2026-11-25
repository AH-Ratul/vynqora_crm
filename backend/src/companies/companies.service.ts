import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCompanyDto) {
    return this.prisma.company.create({ data: dto });
  }

  async findAll(dto: PaginationDto) {
    const { page = 1, limit = 20, search } = dto;
    const skip = (page - 1) * limit;
    const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};
    const [data, total] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        where, skip, take: limit,
        include: { _count: { select: { contacts: true, deals: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.company.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        contacts: { select: { id: true, firstName: true, lastName: true, email: true, title: true } },
        deals: { select: { id: true, title: true, stage: true, value: true } },
      },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto) {
    await this.findOne(id);
    return this.prisma.company.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    // Detach contacts and deals rather than deleting them
    return this.prisma.$transaction(async (tx) => {
      await tx.contact.updateMany({ where: { companyId: id }, data: { companyId: null } });
      await tx.deal.updateMany({ where: { companyId: id }, data: { companyId: null } });
      return tx.company.delete({ where: { id } });
    });
  }
}

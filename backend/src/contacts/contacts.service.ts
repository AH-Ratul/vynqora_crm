import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { FilterContactsDto } from './dto/filter-contacts.dto';

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateContactDto) {
    await this.assertEmailFree(dto.email);
    return this.prisma.contact.create({ data: dto, include: { company: true } });
  }

  private buildWhere(dto: FilterContactsDto) {
    const { search, companyId, tag } = dto;
    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }
    if (companyId) where.companyId = companyId;
    if (tag) where.tags = { has: tag };
    return where;
  }

  async findAll(dto: FilterContactsDto) {
    const { page = 1, limit = 20 } = dto;
    const where = this.buildWhere(dto);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.contact.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { company: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contact.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
      include: {
        company: true,
        leads: { orderBy: { createdAt: 'desc' } },
        deals: { orderBy: { createdAt: 'desc' } },
        tasks: {
          where: { status: { notIn: ['DONE', 'CANCELLED'] } },
          orderBy: { dueDate: 'asc' },
        },
      },
    });
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  async update(id: string, dto: UpdateContactDto) {
    await this.findOne(id);
    await this.assertEmailFree(dto.email, id);
    return this.prisma.contact.update({ where: { id }, data: dto, include: { company: true } });
  }

  /**
   * Deleting a contact removes its leads and detaches its activities/tasks.
   * Contacts that still have deals cannot be deleted (delete/reassign the deals first).
   */
  async remove(id: string) {
    const contact = await this.findOne(id);
    if (contact.deals.length > 0) {
      throw new ConflictException('Contact has deals. Delete or reassign them first.');
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.lead.deleteMany({ where: { contactId: id } });
      await tx.activity.updateMany({ where: { contactId: id }, data: { contactId: null } });
      await tx.task.updateMany({ where: { contactId: id }, data: { contactId: null } });
      return tx.contact.delete({ where: { id } });
    });
  }

  /** Bulk import (frontend parses the CSV). Rows with an existing email are updated. */
  async importMany(rows: CreateContactDto[]) {
    let created = 0;
    let updated = 0;
    await this.prisma.$transaction(async (tx) => {
      for (const row of rows) {
        if (row.email) {
          const existing = await tx.contact.findUnique({ where: { email: row.email } });
          if (existing) {
            await tx.contact.update({ where: { id: existing.id }, data: row });
            updated++;
            continue;
          }
        }
        await tx.contact.create({ data: row });
        created++;
      }
    });
    return { created, updated, total: rows.length };
  }

  async exportCsv(dto: FilterContactsDto) {
    const data = await this.prisma.contact.findMany({
      where: this.buildWhere(dto),
      include: { company: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const header = ['firstName', 'lastName', 'email', 'phone', 'title', 'tags', 'company'];
    const rows = data.map((c) =>
      [c.firstName, c.lastName, c.email, c.phone, c.title, c.tags.join('|'), c.company?.name]
        .map(csvCell)
        .join(','),
    );
    return [header.join(','), ...rows].join('\n');
  }

  private async assertEmailFree(email?: string, excludeId?: string) {
    if (!email) return;
    const existing = await this.prisma.contact.findUnique({ where: { email } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('A contact with this email already exists');
    }
  }
}

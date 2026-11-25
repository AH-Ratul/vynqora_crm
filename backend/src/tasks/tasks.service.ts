import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTasksDto } from './dto/filter-tasks.dto';

const INCLUDE = {
  contact: { select: { id: true, firstName: true, lastName: true } },
  deal: { select: { id: true, title: true } },
  assignedTo: { select: { id: true, firstName: true, lastName: true } },
};

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(dto: CreateTaskDto, userId: string) {
    const task = await this.prisma.task.create({
      data: { ...dto, createdById: userId },
      include: INCLUDE,
    });
    await this.notifyAssignee(task.assignedToId, userId, task.title, task.id);
    return task;
  }

  async findAll(dto: FilterTasksDto) {
    const { page = 1, limit = 20, search, status, assignedToId, contactId, dealId } = dto;
    const where: any = {};
    if (status) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;
    if (contactId) where.contactId = contactId;
    if (dealId) where.dealId = dealId;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: INCLUDE,
        orderBy: [{ dueDate: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }],
      }),
      this.prisma.task.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id }, include: INCLUDE });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(id: string, dto: UpdateTaskDto, userId: string) {
    const before = await this.findOne(id);
    const task = await this.prisma.task.update({ where: { id }, data: dto, include: INCLUDE });
    if (dto.assignedToId && dto.assignedToId !== before.assignedToId) {
      await this.notifyAssignee(task.assignedToId, userId, task.title, task.id);
    }
    return task;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.task.delete({ where: { id } });
  }

  private async notifyAssignee(assigneeId: string | null, actorId: string, title: string, taskId: string) {
    if (!assigneeId || assigneeId === actorId) return;
    await this.notifications.create(assigneeId, 'New task assigned', title, `/tasks?id=${taskId}`);
  }
}

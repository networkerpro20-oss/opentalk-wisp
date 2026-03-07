import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWebhookDto, UpdateWebhookDto } from './dto/create-webhook.dto';

@Injectable()
export class WebhooksService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateWebhookDto) {
    return this.prisma.webhook.create({
      data: {
        name: dto.name,
        url: dto.url,
        secret: dto.secret,
        events: dto.events,
        maxRetries: dto.maxRetries ?? 3,
        organizationId,
      },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.webhook.findMany({
      where: { organizationId },
      include: { _count: { select: { logs: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, organizationId },
      include: {
        logs: { take: 50, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!webhook) throw new NotFoundException('Webhook not found');
    return webhook;
  }

  async update(id: string, organizationId: string, dto: UpdateWebhookDto) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, organizationId },
    });
    if (!webhook) throw new NotFoundException('Webhook not found');

    return this.prisma.webhook.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.url !== undefined && { url: dto.url }),
        ...(dto.secret !== undefined && { secret: dto.secret }),
        ...(dto.events !== undefined && { events: dto.events }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.maxRetries !== undefined && { maxRetries: dto.maxRetries }),
      },
    });
  }

  async delete(id: string, organizationId: string) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, organizationId },
    });
    if (!webhook) throw new NotFoundException('Webhook not found');
    return this.prisma.webhook.delete({ where: { id } });
  }

  async getLogs(webhookId: string, organizationId: string, page = 1, limit = 50) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id: webhookId, organizationId },
    });
    if (!webhook) throw new NotFoundException('Webhook not found');

    const [logs, total] = await Promise.all([
      this.prisma.webhookLog.findMany({
        where: { webhookId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.webhookLog.count({ where: { webhookId } }),
    ]);

    return { data: logs, meta: { page, limit, total } };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Message, Prisma, MessageStatus } from '@prisma/client';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async create(
    organizationId: string,
    userId: string,
    createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    const message = await this.prisma.message.create({
      data: {
        ...createMessageDto,
        organizationId,
        sentById: userId,
        status: MessageStatus.SENT,
      },
      include: {
        sentBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        conversation: {
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Actualizar lastMessageAt de la conversación
    await this.prisma.conversation.update({
      where: { id: createMessageDto.conversationId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }

  async findAll(
    organizationId: string,
    params?: {
      skip?: number;
      take?: number;
      conversationId?: string;
      contactId?: string;
      orderBy?: Prisma.MessageOrderByWithRelationInput;
    },
  ) {
    const { skip = 0, take = 50, conversationId, contactId, orderBy } = params || {};

    const where: Prisma.MessageWhereInput = {
      organizationId,
      ...(conversationId && { conversationId }),
      ...(contactId && { contactId }),
    };

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        skip,
        take,
        orderBy: orderBy || { sentAt: 'desc' },
        include: {
          sentBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          conversation: {
            select: {
              id: true,
              status: true,
              contact: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.message.count({ where }),
    ]);

    return {
      data: messages,
      meta: {
        total,
        page: Math.floor(skip / take) + 1,
        lastPage: Math.ceil(total / take),
        perPage: take,
      },
    };
  }

  async findOne(organizationId: string, id: string): Promise<Message> {
    const message = await this.prisma.message.findFirst({
      where: { id, organizationId },
      include: {
        sentBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
        conversation: {
          include: {
            contact: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    return message;
  }

  async update(
    organizationId: string,
    id: string,
    updateMessageDto: UpdateMessageDto,
  ): Promise<Message> {
    const message = await this.prisma.message.findFirst({
      where: { id, organizationId },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    return this.prisma.message.update({
      where: { id },
      data: updateMessageDto,
    });
  }

  async remove(organizationId: string, id: string): Promise<Message> {
    const message = await this.prisma.message.findFirst({
      where: { id, organizationId },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    return this.prisma.message.delete({
      where: { id },
    });
  }

  async markAsRead(
    organizationId: string,
    id: string,
  ): Promise<Message> {
    const message = await this.prisma.message.findFirst({
      where: { id, organizationId },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    return this.prisma.message.update({
      where: { id },
      data: {
        status: MessageStatus.READ,
        readAt: new Date(),
      },
    });
  }

  async getStats(organizationId: string) {
    const [total, sent, delivered, read, failed] = await Promise.all([
      this.prisma.message.count({ where: { organizationId } }),
      this.prisma.message.count({
        where: { organizationId, status: MessageStatus.SENT },
      }),
      this.prisma.message.count({
        where: { organizationId, status: MessageStatus.DELIVERED },
      }),
      this.prisma.message.count({
        where: { organizationId, status: MessageStatus.READ },
      }),
      this.prisma.message.count({
        where: { organizationId, status: MessageStatus.FAILED },
      }),
    ]);

    return {
      total,
      sent,
      delivered,
      read,
      failed,
    };
  }
}

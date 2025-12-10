import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { Conversation, Prisma, ConversationStatus } from '@prisma/client';

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  async create(
    organizationId: string,
    createConversationDto: CreateConversationDto,
  ): Promise<Conversation> {
    return this.prisma.conversation.create({
      data: {
        ...createConversationDto,
        organizationId,
      },
      include: {
        contact: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        whatsappInstance: true,
      },
    });
  }

  async findAll(
    organizationId: string,
    params?: {
      skip?: number;
      take?: number;
      status?: ConversationStatus;
      assignedToId?: string;
      contactId?: string;
      orderBy?: Prisma.ConversationOrderByWithRelationInput;
    },
  ) {
    const { skip = 0, take = 20, status, assignedToId, contactId, orderBy } = params || {};

    const where: Prisma.ConversationWhereInput = {
      organizationId,
      ...(status && { status }),
      ...(assignedToId && { assignedToId }),
      ...(contactId && { contactId }),
    };

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        skip,
        take,
        orderBy: orderBy || { lastMessageAt: 'desc' },
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          whatsappInstance: {
            select: {
              id: true,
              name: true,
              phone: true,
              status: true,
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return {
      data: conversations,
      meta: {
        total,
        page: Math.floor(skip / take) + 1,
        lastPage: Math.ceil(total / take),
        perPage: take,
      },
    };
  }

  async findOne(organizationId: string, id: string): Promise<Conversation> {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, organizationId },
      include: {
        contact: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
        whatsappInstance: true,
        messages: {
          orderBy: { sentAt: 'asc' },
          include: {
            sentBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    return conversation;
  }

  async update(
    organizationId: string,
    id: string,
    updateConversationDto: UpdateConversationDto,
  ): Promise<Conversation> {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, organizationId },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    const updateData: any = { ...updateConversationDto };

    // Si se cierra la conversación, guardar timestamp
    if (updateConversationDto.status === ConversationStatus.CLOSED) {
      updateData.closedAt = new Date();
    }

    return this.prisma.conversation.update({
      where: { id },
      data: updateData,
      include: {
        contact: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
  }

  async remove(organizationId: string, id: string): Promise<Conversation> {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, organizationId },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    return this.prisma.conversation.delete({
      where: { id },
    });
  }

  async getStats(organizationId: string) {
    const [total, open, pending, resolved, closed, unassigned] =
      await Promise.all([
        this.prisma.conversation.count({ where: { organizationId } }),
        this.prisma.conversation.count({
          where: { organizationId, status: ConversationStatus.OPEN },
        }),
        this.prisma.conversation.count({
          where: { organizationId, status: ConversationStatus.PENDING },
        }),
        this.prisma.conversation.count({
          where: { organizationId, status: ConversationStatus.RESOLVED },
        }),
        this.prisma.conversation.count({
          where: { organizationId, status: ConversationStatus.CLOSED },
        }),
        this.prisma.conversation.count({
          where: { organizationId, assignedToId: null },
        }),
      ]);

    return {
      total,
      open,
      pending,
      resolved,
      closed,
      unassigned,
    };
  }

  async assignToUser(
    organizationId: string,
    conversationId: string,
    userId: string,
  ): Promise<Conversation> {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, organizationId },
    });

    if (!conversation) {
      throw new NotFoundException(
        `Conversation with ID ${conversationId} not found`,
      );
    }

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { assignedToId: userId },
      include: {
        contact: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
  }
}

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { Conversation, Prisma, ConversationStatus, ConversationDisposition, DealStatus } from '@prisma/client';

// Dispositions that should create/link a Deal
const DEAL_CREATING_DISPOSITIONS: ConversationDisposition[] = [
  ConversationDisposition.PROSPECT,
  ConversationDisposition.CONTACTED,
  ConversationDisposition.QUALIFIED,
  ConversationDisposition.FOLLOW_UP,
];

const DEAL_WON_DISPOSITIONS: ConversationDisposition[] = [
  ConversationDisposition.CLIENT,
];

const DEAL_LOST_DISPOSITIONS: ConversationDisposition[] = [
  ConversationDisposition.NOT_INTERESTED,
  ConversationDisposition.SPAM,
];

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

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
      disposition?: ConversationDisposition;
      assignedToId?: string;
      contactId?: string;
      orderBy?: Prisma.ConversationOrderByWithRelationInput;
    },
  ) {
    const { skip = 0, take = 20, status, disposition, assignedToId, contactId, orderBy } = params || {};

    const where: Prisma.ConversationWhereInput = {
      organizationId,
      ...(status && { status }),
      ...(disposition && { disposition }),
      ...(assignedToId && { assignedToId }),
      ...(contactId && { contactId }),
    };

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        skip,
        take,
        orderBy: orderBy || { updatedAt: 'desc' },
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
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              content: true,
              createdAt: true,
              direction: true,
              type: true,
            },
          },
          deal: {
            select: {
              id: true,
              title: true,
              value: true,
              status: true,
              stage: { select: { id: true, name: true } },
              pipeline: { select: { id: true, name: true } },
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
        deal: {
          select: {
            id: true,
            title: true,
            value: true,
            currency: true,
            status: true,
            probability: true,
            stage: { select: { id: true, name: true, color: true } },
            pipeline: { select: { id: true, name: true } },
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
    userId?: string,
  ): Promise<Conversation> {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, organizationId },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    const updateData: any = { ...updateConversationDto };

    // Si se resuelve la conversacion, guardar timestamp y quien resolvio
    if (updateConversationDto.status === ConversationStatus.RESOLVED && !conversation.resolvedAt) {
      updateData.resolvedAt = new Date();
      if (userId) updateData.resolvedById = userId;
    }

    // Si se cierra la conversacion, guardar timestamp
    if (updateConversationDto.status === ConversationStatus.CLOSED) {
      updateData.closedAt = new Date();
      if (!conversation.resolvedAt) {
        updateData.resolvedAt = new Date();
        if (userId) updateData.resolvedById = userId;
      }
    }

    // Si se reabre, limpiar timestamps
    if (updateConversationDto.status === ConversationStatus.OPEN) {
      updateData.closedAt = null;
      updateData.resolvedAt = null;
      updateData.resolvedById = null;
    }

    const updated = await this.prisma.conversation.update({
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
        deal: {
          select: {
            id: true,
            title: true,
            value: true,
            status: true,
            stage: { select: { id: true, name: true } },
            pipeline: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Sincronizar Deal cuando cambia la disposicion
    if (updateConversationDto.disposition !== undefined) {
      await this.syncDealWithDisposition(organizationId, updated, userId);
    }

    return updated;
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

  /**
   * Sincroniza un Deal con el cambio de disposicion de una conversacion.
   * - PROSPECT/CONTACTED/QUALIFIED/FOLLOW_UP → Crea Deal si no existe
   * - CLIENT → Marca Deal como WON
   * - NOT_INTERESTED/SPAM → Marca Deal como LOST
   */
  private async syncDealWithDisposition(
    organizationId: string,
    conversation: any,
    userId?: string,
  ): Promise<void> {
    try {
      const disposition = conversation.disposition as ConversationDisposition | null;

      if (!disposition) return;

      // Buscar deal existente vinculado a esta conversacion
      const existingDeal = await this.prisma.deal.findUnique({
        where: { conversationId: conversation.id },
      });

      if (DEAL_CREATING_DISPOSITIONS.includes(disposition)) {
        if (!existingDeal) {
          await this.createDealFromConversation(organizationId, conversation, userId);
        }
      } else if (DEAL_WON_DISPOSITIONS.includes(disposition)) {
        if (existingDeal && existingDeal.status === DealStatus.OPEN) {
          await this.prisma.deal.update({
            where: { id: existingDeal.id },
            data: { status: DealStatus.WON, closedDate: new Date() },
          });
          this.logger.log(`Deal ${existingDeal.id} marked as WON (conversation ${conversation.id} → CLIENT)`);
        } else if (!existingDeal) {
          // Crear deal y marcarlo como ganado directamente
          const deal = await this.createDealFromConversation(organizationId, conversation, userId);
          if (deal) {
            await this.prisma.deal.update({
              where: { id: deal.id },
              data: { status: DealStatus.WON, closedDate: new Date() },
            });
          }
        }
      } else if (DEAL_LOST_DISPOSITIONS.includes(disposition)) {
        if (existingDeal && existingDeal.status === DealStatus.OPEN) {
          await this.prisma.deal.update({
            where: { id: existingDeal.id },
            data: { status: DealStatus.LOST, closedDate: new Date() },
          });
          this.logger.log(`Deal ${existingDeal.id} marked as LOST (conversation ${conversation.id} → ${disposition})`);
        }
      }
    } catch (error) {
      this.logger.error(`Error syncing deal for conversation ${conversation.id}: ${error.message}`);
    }
  }

  /**
   * Crea un Deal automaticamente desde una conversacion.
   * Usa el primer pipeline y primer stage de la organizacion.
   */
  private async createDealFromConversation(
    organizationId: string,
    conversation: any,
    userId?: string,
  ) {
    // Buscar el primer pipeline de la organizacion con sus stages
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { organizationId },
      orderBy: { order: 'asc' },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          take: 1,
        },
      },
    });

    if (!pipeline || pipeline.stages.length === 0) {
      this.logger.warn(`No pipeline/stages found for org ${organizationId}. Cannot auto-create deal.`);
      return null;
    }

    const firstStage = pipeline.stages[0];
    const contactName = conversation.contact?.name || 'Sin nombre';

    const deal = await this.prisma.deal.create({
      data: {
        title: `${contactName} - Conversacion`,
        value: 0,
        currency: 'USD',
        contactId: conversation.contactId,
        pipelineId: pipeline.id,
        stageId: firstStage.id,
        organizationId,
        conversationId: conversation.id,
        ...(userId && { assignedToId: userId }),
        ...(conversation.assignedToId && { assignedToId: conversation.assignedToId }),
      },
    });

    this.logger.log(`Auto-created Deal ${deal.id} for conversation ${conversation.id} (${contactName})`);
    return deal;
  }
}

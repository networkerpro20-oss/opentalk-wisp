import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInternalNoteDto } from './dto/create-internal-note.dto';
import { UpdateInternalNoteDto } from './dto/update-internal-note.dto';

@Injectable()
export class InternalNotesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new internal note
   */
  async create(userId: string, organizationId: string, createInternalNoteDto: CreateInternalNoteDto) {
    // Verify conversation belongs to organization
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: createInternalNoteDto.conversationId,
        organizationId,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.prisma.internalNote.create({
      data: {
        conversationId: createInternalNoteDto.conversationId,
        content: createInternalNoteDto.content,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        conversation: { select: { id: true, status: true } },
      },
    });
  }

  /**
   * Find all notes for a conversation
   */
  async findByConversation(conversationId: string, organizationId: string) {
    // Verify conversation belongs to organization
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, organizationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.prisma.internalNote.findMany({
      where: { conversationId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find all notes created by a user
   */
  async findByUser(userId: string, organizationId: string) {
    // Verify user belongs to organization
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.internalNote.findMany({
      where: {
        createdById: userId,
        conversation: { organizationId },
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        conversation: {
          select: {
            id: true,
            status: true,
            contact: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find a specific note
   */
  async findOne(id: string, organizationId: string) {
    const note = await this.prisma.internalNote.findFirst({
      where: {
        id,
        conversation: { organizationId },
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        conversation: {
          select: {
            id: true,
            status: true,
            contact: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!note) {
      throw new NotFoundException('Internal note not found');
    }

    return note;
  }

  /**
   * Update an internal note (only by creator)
   */
  async update(
    id: string,
    userId: string,
    organizationId: string,
    updateInternalNoteDto: UpdateInternalNoteDto,
  ) {
    const note = await this.findOne(id, organizationId);

    // Only creator can update
    if (note.createdById !== userId) {
      throw new ForbiddenException('You can only update your own notes');
    }

    return this.prisma.internalNote.update({
      where: { id },
      data: updateInternalNoteDto,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        conversation: {
          select: {
            id: true,
            status: true,
            contact: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  /**
   * Delete an internal note (only by creator)
   */
  async remove(id: string, userId: string, organizationId: string) {
    const note = await this.findOne(id, organizationId);

    // Only creator can delete
    if (note.createdById !== userId) {
      throw new ForbiddenException('You can only delete your own notes');
    }

    return this.prisma.internalNote.delete({ where: { id } });
  }

  /**
   * Search notes by content
   */
  async search(organizationId: string, query: string) {
    return this.prisma.internalNote.findMany({
      where: {
        conversation: { organizationId },
        content: { contains: query, mode: 'insensitive' },
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        conversation: {
          select: {
            id: true,
            status: true,
            contact: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}

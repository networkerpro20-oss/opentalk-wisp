import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuickReplyDto } from './dto/create-quick-reply.dto';
import { UpdateQuickReplyDto } from './dto/update-quick-reply.dto';

@Injectable()
export class QuickRepliesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new quick reply
   */
  async create(userId: string, organizationId: string, createQuickReplyDto: CreateQuickReplyDto) {
    // Check if shortcut already exists
    const existing = await this.prisma.quickReply.findFirst({
      where: {
        organizationId,
        shortcut: createQuickReplyDto.shortcut,
      },
    });

    if (existing) {
      throw new ConflictException(`Shortcut '${createQuickReplyDto.shortcut}' already exists`);
    }

    return this.prisma.quickReply.create({
      data: {
        ...createQuickReplyDto,
        organizationId,
        createdById: userId,
        isActive: createQuickReplyDto.isActive ?? true,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /**
   * Find all quick replies for an organization
   */
  async findAll(organizationId: string, isActive?: boolean) {
    const where: any = { organizationId };
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.quickReply.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { shortcut: 'asc' },
    });
  }

  /**
   * Search quick replies by shortcut or content
   */
  async search(organizationId: string, query: string) {
    return this.prisma.quickReply.findMany({
      where: {
        organizationId,
        isActive: true,
        OR: [
          { shortcut: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
      take: 10,
    });
  }

  /**
   * Get quick reply by shortcut
   */
  async getByShortcut(organizationId: string, shortcut: string) {
    const reply = await this.prisma.quickReply.findFirst({
      where: {
        organizationId,
        shortcut,
        isActive: true,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!reply) {
      throw new NotFoundException(`Quick reply with shortcut '${shortcut}' not found`);
    }

    return reply;
  }

  /**
   * Find a specific quick reply
   */
  async findOne(id: string, organizationId: string) {
    const reply = await this.prisma.quickReply.findFirst({
      where: { id, organizationId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!reply) {
      throw new NotFoundException('Quick reply not found');
    }

    return reply;
  }

  /**
   * Update a quick reply
   */
  async update(id: string, organizationId: string, updateQuickReplyDto: UpdateQuickReplyDto) {
    await this.findOne(id, organizationId);

    // Check shortcut uniqueness if updating
    if (updateQuickReplyDto.shortcut) {
      const existing = await this.prisma.quickReply.findFirst({
        where: {
          organizationId,
          shortcut: updateQuickReplyDto.shortcut,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(`Shortcut '${updateQuickReplyDto.shortcut}' already exists`);
      }
    }

    return this.prisma.quickReply.update({
      where: { id },
      data: updateQuickReplyDto,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /**
   * Delete a quick reply
   */
  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.quickReply.delete({ where: { id } });
  }

  /**
   * Process quick reply content with variable substitution
   */
  async processContent(
    content: string,
    variables: {
      contactName?: string;
      agentName?: string;
      organizationName?: string;
      [key: string]: string | undefined;
    },
  ): Promise<string> {
    let processed = content;

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      if (value) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processed = processed.replace(regex, value);
      }
    });

    return processed;
  }

  /**
   * Get quick replies by tags
   */
  async findByTags(organizationId: string, tags: string[]) {
    return this.prisma.quickReply.findMany({
      where: {
        organizationId,
        isActive: true,
        tags: {
          hasSome: tags,
        },
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { shortcut: 'asc' },
    });
  }
}

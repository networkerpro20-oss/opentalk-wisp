import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new tag
   */
  async create(organizationId: string, createTagDto: CreateTagDto) {
    // Check if tag name already exists
    const existing = await this.prisma.tag.findUnique({
      where: {
        organizationId_name: {
          organizationId,
          name: createTagDto.name,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Tag '${createTagDto.name}' already exists`);
    }

    return this.prisma.tag.create({
      data: {
        ...createTagDto,
        organizationId,
      },
    });
  }

  /**
   * Find all tags for an organization
   */
  async findAll(organizationId: string) {
    return this.prisma.tag.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            contacts: true,
            conversations: true,
          },
        },
      },
    });
  }

  /**
   * Find a specific tag
   */
  async findOne(id: string, organizationId: string) {
    const tag = await this.prisma.tag.findFirst({
      where: { id, organizationId },
      include: {
        _count: {
          select: {
            contacts: true,
            conversations: true,
          },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return tag;
  }

  /**
   * Update a tag
   */
  async update(id: string, organizationId: string, updateTagDto: UpdateTagDto) {
    await this.findOne(id, organizationId);

    // Check name uniqueness if updating name
    if (updateTagDto.name) {
      const existing = await this.prisma.tag.findUnique({
        where: {
          organizationId_name: {
            organizationId,
            name: updateTagDto.name,
          },
        },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(`Tag '${updateTagDto.name}' already exists`);
      }
    }

    return this.prisma.tag.update({
      where: { id },
      data: updateTagDto,
      include: {
        _count: {
          select: {
            contacts: true,
            conversations: true,
          },
        },
      },
    });
  }

  /**
   * Delete a tag
   */
  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.tag.delete({ where: { id } });
  }

  /**
   * Assign tags to a contact
   */
  async assignToContact(contactId: string, organizationId: string, tagIds: string[]) {
    // Verify contact belongs to organization
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, organizationId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    // Verify all tags belong to organization
    const tags = await this.prisma.tag.findMany({
      where: { id: { in: tagIds }, organizationId },
    });

    if (tags.length !== tagIds.length) {
      throw new NotFoundException('One or more tags not found');
    }

    // Remove existing tags and add new ones
    await this.prisma.contactTag.deleteMany({
      where: { contactId },
    });

    await this.prisma.contactTag.createMany({
      data: tagIds.map((tagId) => ({ contactId, tagId })),
      skipDuplicates: true,
    });

    return this.getContactTags(contactId, organizationId);
  }

  /**
   * Assign tags to a conversation
   */
  async assignToConversation(conversationId: string, organizationId: string, tagIds: string[]) {
    // Verify conversation belongs to organization
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, organizationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Verify all tags belong to organization
    const tags = await this.prisma.tag.findMany({
      where: { id: { in: tagIds }, organizationId },
    });

    if (tags.length !== tagIds.length) {
      throw new NotFoundException('One or more tags not found');
    }

    // Remove existing tags and add new ones
    await this.prisma.conversationTag.deleteMany({
      where: { conversationId },
    });

    await this.prisma.conversationTag.createMany({
      data: tagIds.map((tagId) => ({ conversationId, tagId })),
      skipDuplicates: true,
    });

    return this.getConversationTags(conversationId, organizationId);
  }

  /**
   * Get tags for a contact
   */
  async getContactTags(contactId: string, organizationId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, organizationId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact.tags.map((ct) => ct.tag);
  }

  /**
   * Get tags for a conversation
   */
  async getConversationTags(conversationId: string, organizationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, organizationId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation.tags.map((ct) => ct.tag);
  }

  /**
   * Remove a tag from a contact
   */
  async removeFromContact(contactId: string, tagId: string, organizationId: string) {
    // Verify contact belongs to organization
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, organizationId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    await this.prisma.contactTag.delete({
      where: {
        contactId_tagId: {
          contactId,
          tagId,
        },
      },
    });

    return { success: true };
  }

  /**
   * Remove a tag from a conversation
   */
  async removeFromConversation(conversationId: string, tagId: string, organizationId: string) {
    // Verify conversation belongs to organization
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, organizationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    await this.prisma.conversationTag.delete({
      where: {
        conversationId_tagId: {
          conversationId,
          tagId,
        },
      },
    });

    return { success: true };
  }

  /**
   * Get contacts by tag
   */
  async getContactsByTag(tagId: string, organizationId: string) {
    await this.findOne(tagId, organizationId);

    const contactTags = await this.prisma.contactTag.findMany({
      where: {
        tagId,
        contact: { organizationId },
      },
      include: {
        contact: true,
      },
    });

    return contactTags.map((ct) => ct.contact);
  }

  /**
   * Get conversations by tag
   */
  async getConversationsByTag(tagId: string, organizationId: string) {
    await this.findOne(tagId, organizationId);

    const conversationTags = await this.prisma.conversationTag.findMany({
      where: {
        tagId,
        conversation: { organizationId },
      },
      include: {
        conversation: {
          include: {
            contact: true,
          },
        },
      },
    });

    return conversationTags.map((ct) => ct.conversation);
  }
}

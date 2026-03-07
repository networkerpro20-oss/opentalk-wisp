import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Contact, Prisma } from '@prisma/client';

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(private prisma: PrismaService) {}

  async create(
    organizationId: string,
    createContactDto: CreateContactDto,
  ): Promise<Contact> {
    return this.prisma.contact.create({
      data: {
        ...createContactDto,
        organizationId,
      },
      include: {
        conversations: {
          take: 5,
          orderBy: { updatedAt: 'desc' },
        },
        deals: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findAll(
    organizationId: string,
    params?: {
      skip?: number;
      take?: number;
      search?: string;
      orderBy?: Prisma.ContactOrderByWithRelationInput;
    },
  ) {
    const { skip = 0, take = 20, search, orderBy } = params || {};

    const where: Prisma.ContactWhereInput = {
      organizationId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    try {
      const [contacts, total] = await Promise.all([
        this.prisma.contact.findMany({
          where,
          skip,
          take,
          orderBy: orderBy || { createdAt: 'desc' },
          include: {
            conversations: {
              take: 1,
              orderBy: { updatedAt: 'desc' },
            },
            deals: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
            _count: {
              select: {
                conversations: true,
                deals: true,
              },
            },
          },
        }),
        this.prisma.contact.count({ where }),
      ]);

      return {
        data: contacts,
        meta: {
          total,
          page: Math.floor(skip / take) + 1,
          lastPage: Math.ceil(total / take),
          perPage: take,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch contacts for org ${organizationId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findOne(organizationId: string, id: string): Promise<Contact> {
    const contact = await this.prisma.contact.findFirst({
      where: { id, organizationId },
      include: {
        conversations: {
          orderBy: { updatedAt: 'desc' },
          include: {
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            _count: {
              select: { messages: true },
            },
          },
        },
        deals: {
          orderBy: { createdAt: 'desc' },
          include: {
            stage: true,
            pipeline: true,
          },
        },
        activities: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }

    return contact;
  }

  async update(
    organizationId: string,
    id: string,
    updateContactDto: UpdateContactDto,
  ): Promise<Contact> {
    const contact = await this.prisma.contact.findFirst({
      where: { id, organizationId },
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }

    return this.prisma.contact.update({
      where: { id },
      data: updateContactDto,
    });
  }

  async remove(organizationId: string, id: string): Promise<Contact> {
    const contact = await this.prisma.contact.findFirst({
      where: { id, organizationId },
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }

    return this.prisma.contact.delete({
      where: { id },
    });
  }

  async getStats(organizationId: string) {
    const [total, withEmail, withPhone, withDeals, recentlyAdded] =
      await Promise.all([
        this.prisma.contact.count({ where: { organizationId } }),
        this.prisma.contact.count({
          where: {
            organizationId,
            email: { not: null },
          },
        }),
        this.prisma.contact.count({
          where: {
            organizationId,
            phone: { not: null },
          },
        }),
        this.prisma.contact.count({
          where: {
            organizationId,
            deals: {
              some: {},
            },
          },
        }),
        this.prisma.contact.count({
          where: {
            organizationId,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        }),
      ]);

    return {
      total,
      withEmail,
      withPhone,
      withDeals,
      recentlyAdded,
    };
  }
}

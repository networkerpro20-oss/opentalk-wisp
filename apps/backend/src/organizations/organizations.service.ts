import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async findByUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.organization;
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return this.prisma.organization.update({
      where: { id },
      data: dto,
    });
  }

  async getStats(organizationId: string) {
    const [
      usersCount,
      contactsCount,
      conversationsCount,
      dealsCount,
      whatsappCount,
    ] = await Promise.all([
      this.prisma.user.count({ where: { organizationId } }),
      this.prisma.contact.count({ where: { organizationId } }),
      this.prisma.conversation.count({ where: { organizationId } }),
      this.prisma.deal.count({ where: { organizationId } }),
      this.prisma.whatsAppInstance.count({ where: { organizationId } }),
    ]);

    return {
      users: usersCount,
      contacts: contactsCount,
      conversations: conversationsCount,
      deals: dealsCount,
      whatsappInstances: whatsappCount,
    };
  }
}

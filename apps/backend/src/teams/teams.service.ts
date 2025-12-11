import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);

  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, createTeamDto: CreateTeamDto) {
    const team = await this.prisma.team.create({
      data: {
        ...createTeamDto,
        organizationId,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            conversations: true,
          },
        },
      },
    });

    this.logger.log(`Team created: ${team.id} - ${team.name}`);
    return team;
  }

  async findAll(organizationId: string) {
    return this.prisma.team.findMany({
      where: { organizationId },
      include: {
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            conversations: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id, organizationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                status: true,
              },
            },
          },
        },
        conversations: {
          where: { status: 'OPEN' },
          take: 10,
          orderBy: { lastMessageAt: 'desc' },
        },
        _count: {
          select: {
            members: true,
            conversations: true,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException(`Team ${id} not found`);
    }

    return team;
  }

  async update(id: string, organizationId: string, updateTeamDto: UpdateTeamDto) {
    const team = await this.findOne(id, organizationId);

    return this.prisma.team.update({
      where: { id: team.id },
      data: updateTeamDto,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            conversations: true,
          },
        },
      },
    });
  }

  async remove(id: string, organizationId: string) {
    const team = await this.findOne(id, organizationId);

    // Verificar que no haya conversaciones activas asignadas
    const activeConversations = await this.prisma.conversation.count({
      where: {
        assignedToTeamId: team.id,
        status: 'OPEN',
      },
    });

    if (activeConversations > 0) {
      throw new BadRequestException(
        `Cannot delete team with ${activeConversations} active conversations`,
      );
    }

    await this.prisma.team.delete({
      where: { id: team.id },
    });

    this.logger.log(`Team deleted: ${team.id}`);
    return { message: 'Team deleted successfully' };
  }

  // ============================================
  // TEAM MEMBERS
  // ============================================

  async addMember(teamId: string, organizationId: string, addMemberDto: AddTeamMemberDto) {
    const team = await this.findOne(teamId, organizationId);

    // Verificar que el usuario existe y pertenece a la organización
    const user = await this.prisma.user.findFirst({
      where: {
        id: addMemberDto.userId,
        organizationId,
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${addMemberDto.userId} not found`);
    }

    // Verificar que no sea miembro ya
    const existing = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: team.id,
          userId: user.id,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('User is already a member of this team');
    }

    const member = await this.prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: user.id,
        role: addMemberDto.role || 'AGENT',
        isActive: addMemberDto.isActive !== false,
        maxConcurrentChats: addMemberDto.maxConcurrentChats || 5,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    this.logger.log(`Member added to team ${team.id}: ${user.email}`);
    return member;
  }

  async removeMember(teamId: string, organizationId: string, memberId: string) {
    const team = await this.findOne(teamId, organizationId);

    const member = await this.prisma.teamMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.teamId !== team.id) {
      throw new NotFoundException('Team member not found');
    }

    // Reasignar conversaciones del miembro
    await this.prisma.conversation.updateMany({
      where: {
        assignedToId: member.userId,
        assignedToTeamId: team.id,
      },
      data: {
        assignedToId: null,
      },
    });

    await this.prisma.teamMember.delete({
      where: { id: memberId },
    });

    this.logger.log(`Member removed from team ${team.id}: ${memberId}`);
    return { message: 'Member removed successfully' };
  }

  async updateMember(
    teamId: string,
    organizationId: string,
    memberId: string,
    updateData: Partial<AddTeamMemberDto>,
  ) {
    const team = await this.findOne(teamId, organizationId);

    const member = await this.prisma.teamMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.teamId !== team.id) {
      throw new NotFoundException('Team member not found');
    }

    return this.prisma.teamMember.update({
      where: { id: memberId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  // ============================================
  // TEAM STATS
  // ============================================

  async getTeamStats(teamId: string, organizationId: string) {
    const team = await this.findOne(teamId, organizationId);

    const [
      totalMembers,
      activeMembers,
      openConversations,
      totalConversations,
    ] = await Promise.all([
      this.prisma.teamMember.count({
        where: { teamId: team.id },
      }),
      this.prisma.teamMember.count({
        where: { teamId: team.id, isActive: true },
      }),
      this.prisma.conversation.count({
        where: { assignedToTeamId: team.id, status: 'OPEN' },
      }),
      this.prisma.conversation.count({
        where: { assignedToTeamId: team.id },
      }),
    ]);

    return {
      teamId: team.id,
      teamName: team.name,
      totalMembers,
      activeMembers,
      openConversations,
      totalConversations,
      avgConversationsPerMember: activeMembers > 0 ? openConversations / activeMembers : 0,
    };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePresenceDto, PresenceStatus } from './dto/update-presence.dto';

@Injectable()
export class PresenceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Update user presence status
   */
  async updateStatus(userId: string, organizationId: string, updatePresenceDto: UpdatePresenceDto) {
    // Verify user belongs to organization
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId },
    });

    if (!user) {
      throw new NotFoundException('User not found in this organization');
    }

    // Check if presence record exists
    const existingPresence = await this.prisma.userPresence.findUnique({
      where: { userId },
    });

    if (existingPresence) {
      // Update existing presence
      return this.prisma.userPresence.update({
        where: { userId },
        data: {
          status: updatePresenceDto.status,
          customMessage: updatePresenceDto.customMessage,
          isOnBreak: updatePresenceDto.isOnBreak ?? false,
          lastSeenAt: new Date(),
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });
    } else {
      // Create new presence record
      return this.prisma.userPresence.create({
        data: {
          userId,
          status: updatePresenceDto.status,
          customMessage: updatePresenceDto.customMessage,
          isOnBreak: updatePresenceDto.isOnBreak ?? false,
          lastSeenAt: new Date(),
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });
    }
  }

  /**
   * Get current presence status for a user
   */
  async getCurrentStatus(userId: string, organizationId: string) {
    // Verify user belongs to organization
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId },
    });

    if (!user) {
      throw new NotFoundException('User not found in this organization');
    }

    const presence = await this.prisma.userPresence.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    // Return default offline status if no presence record exists
    if (!presence) {
      return {
        userId,
        status: 'OFFLINE' as PresenceStatus,
        customMessage: null,
        isOnBreak: false,
        lastSeenAt: null,
        user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email },
      };
    }

    return presence;
  }

  /**
   * Get presence status for all members of a team
   */
  async getTeamPresence(teamId: string, organizationId: string) {
    // Verify team belongs to organization
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, organizationId },
    });

    if (!team) {
      throw new NotFoundException('Team not found in this organization');
    }

    // Get all active team members with their presence
    const members = await this.prisma.teamMember.findMany({
      where: { teamId, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            presence: true,
          },
        },
      },
    });

    return members.map((member) => ({
      userId: member.user.id,
      name: `${member.user.firstName} ${member.user.lastName}`,
      email: member.user.email,
      role: member.role,
      status: member.user.presence?.status || 'OFFLINE',
      customMessage: member.user.presence?.customMessage,
      isOnBreak: member.user.presence?.isOnBreak || false,
      lastSeenAt: member.user.presence?.lastSeenAt,
    }));
  }

  /**
   * Get all online users in an organization
   */
  async getOnlineUsers(organizationId: string) {
    const users = await this.prisma.user.findMany({
      where: {
        organizationId,
        presence: {
          status: { in: ['ONLINE', 'BUSY'] },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        presence: true,
      },
    });

    return users.map((user) => ({
      userId: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      status: user.presence?.status,
      customMessage: user.presence?.customMessage,
      isOnBreak: user.presence?.isOnBreak,
      lastSeenAt: user.presence?.lastSeenAt,
    }));
  }

  /**
   * Automatically set user to offline after inactivity
   */
  async checkInactivity(userId: string) {
    const presence = await this.prisma.userPresence.findUnique({
      where: { userId },
    });

    if (!presence) return;

    const inactiveMinutes = 15;
    const inactiveThreshold = new Date(Date.now() - inactiveMinutes * 60 * 1000);

    // If last seen was more than 15 minutes ago and not already offline
    if (presence.lastSeenAt < inactiveThreshold && presence.status !== 'OFFLINE') {
      await this.prisma.userPresence.update({
        where: { userId },
        data: { status: 'AWAY' },
      });
    }
  }

  /**
   * Update last seen timestamp (called on user activity)
   */
  async updateLastSeen(userId: string) {
    const presence = await this.prisma.userPresence.findUnique({
      where: { userId },
    });

    if (presence) {
      await this.prisma.userPresence.update({
        where: { userId },
        data: { lastSeenAt: new Date() },
      });
    }
  }
}

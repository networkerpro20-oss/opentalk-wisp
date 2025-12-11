import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoutingRuleDto } from './dto/create-routing-rule.dto';
import { UpdateRoutingRuleDto } from './dto/update-routing-rule.dto';

enum AssignmentType {
  ROUND_ROBIN = 'ROUND_ROBIN',
  LEAST_BUSY = 'LEAST_BUSY',
  SPECIFIC_USER = 'SPECIFIC_USER',
  SPECIFIC_TEAM = 'SPECIFIC_TEAM',
  LOAD_BALANCED = 'LOAD_BALANCED',
}

@Injectable()
export class RoutingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new routing rule
   */
  async create(organizationId: string, createRoutingRuleDto: CreateRoutingRuleDto) {
    const { assignToUserId, assignToTeamId, ...data } = createRoutingRuleDto;

    // Validate user belongs to organization if assignToUserId is provided
    if (assignToUserId) {
      const user = await this.prisma.user.findFirst({
        where: { id: assignToUserId, organizationId },
      });
      if (!user) {
        throw new NotFoundException('Assigned user not found in this organization');
      }
    }

    // Validate team belongs to organization if assignToTeamId is provided
    if (assignToTeamId) {
      const team = await this.prisma.team.findFirst({
        where: { id: assignToTeamId, organizationId },
      });
      if (!team) {
        throw new NotFoundException('Assigned team not found in this organization');
      }
    }

    return this.prisma.routingRule.create({
      data: {
        ...data,
        organizationId,
        assignToUserId,
        assignToTeamId,
      },
      include: {
        assignToUser: { select: { id: true, name: true, email: true } },
        assignToTeam: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Find all routing rules for an organization
   */
  async findAll(organizationId: string) {
    return this.prisma.routingRule.findMany({
      where: { organizationId },
      include: {
        assignToUser: { select: { id: true, name: true, email: true } },
        assignToTeam: { select: { id: true, name: true } },
      },
      orderBy: { priority: 'desc' },
    });
  }

  /**
   * Find a specific routing rule
   */
  async findOne(id: string, organizationId: string) {
    const rule = await this.prisma.routingRule.findFirst({
      where: { id, organizationId },
      include: {
        assignToUser: { select: { id: true, name: true, email: true } },
        assignToTeam: { select: { id: true, name: true } },
      },
    });

    if (!rule) {
      throw new NotFoundException('Routing rule not found');
    }

    return rule;
  }

  /**
   * Update a routing rule
   */
  async update(id: string, organizationId: string, updateRoutingRuleDto: UpdateRoutingRuleDto) {
    await this.findOne(id, organizationId);

    const { assignToUserId, assignToTeamId, ...data } = updateRoutingRuleDto;

    // Validate user if provided
    if (assignToUserId) {
      const user = await this.prisma.user.findFirst({
        where: { id: assignToUserId, organizationId },
      });
      if (!user) {
        throw new NotFoundException('Assigned user not found in this organization');
      }
    }

    // Validate team if provided
    if (assignToTeamId) {
      const team = await this.prisma.team.findFirst({
        where: { id: assignToTeamId, organizationId },
      });
      if (!team) {
        throw new NotFoundException('Assigned team not found in this organization');
      }
    }

    return this.prisma.routingRule.update({
      where: { id },
      data: {
        ...data,
        assignToUserId,
        assignToTeamId,
      },
      include: {
        assignToUser: { select: { id: true, name: true, email: true } },
        assignToTeam: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Delete a routing rule
   */
  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.routingRule.delete({ where: { id } });
  }

  /**
   * Evaluate routing rules for a conversation and determine assignment
   */
  async evaluateRules(conversationId: string, organizationId: string) {
    // Get conversation with contact info
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Get active routing rules ordered by priority
    const rules = await this.prisma.routingRule.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: { priority: 'desc' },
      include: {
        assignToUser: true,
        assignToTeam: {
          include: {
            members: {
              where: { isActive: true },
              include: { user: { include: { presence: true } } },
            },
          },
        },
      },
    });

    // Evaluate each rule
    for (const rule of rules) {
      const conditions = rule.conditions as any;
      let matches = true;

      // Check channel condition
      if (conditions.channel && conversation.channel !== conditions.channel) {
        matches = false;
      }

      // Check keywords condition (in last message or contact name)
      if (matches && conditions.keywords && conditions.keywords.length > 0) {
        const lastMessage = await this.prisma.message.findFirst({
          where: { conversationId },
          orderBy: { createdAt: 'desc' },
        });

        const textToCheck = `${lastMessage?.content || ''} ${conversation.contact.name || ''}`.toLowerCase();
        const keywordMatch = conditions.keywords.some((keyword: string) =>
          textToCheck.includes(keyword.toLowerCase()),
        );

        if (!keywordMatch) {
          matches = false;
        }
      }

      // Check working hours condition
      if (matches && conditions.hours) {
        const now = new Date();
        const currentHour = now.getHours();
        const startHour = parseInt(conditions.hours.start.split(':')[0]);
        const endHour = parseInt(conditions.hours.end.split(':')[0]);

        if (currentHour < startHour || currentHour >= endHour) {
          matches = false;
        }
      }

      // If rule matches, perform assignment
      if (matches) {
        return this.assignConversation(conversationId, rule);
      }
    }

    // No matching rule found
    return null;
  }

  /**
   * Assign conversation based on routing rule
   */
  private async assignConversation(conversationId: string, rule: any) {
    let assignedUserId: string | null = null;

    switch (rule.assignmentType) {
      case AssignmentType.SPECIFIC_USER:
        assignedUserId = rule.assignToUserId;
        break;

      case AssignmentType.SPECIFIC_TEAM:
        // Assign to team but no specific user yet
        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { assignedToTeamId: rule.assignToTeamId },
        });
        return { assignedToTeamId: rule.assignToTeamId, assignedToUserId: null };

      case AssignmentType.ROUND_ROBIN:
        assignedUserId = await this.getRoundRobinUser(rule.assignToTeamId);
        break;

      case AssignmentType.LEAST_BUSY:
        assignedUserId = await this.getLeastBusyUser(rule.assignToTeamId);
        break;

      case AssignmentType.LOAD_BALANCED:
        assignedUserId = await this.getLoadBalancedUser(rule.assignToTeamId);
        break;
    }

    // Update conversation with assignment
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        assignedToUserId: assignedUserId,
        assignedToTeamId: rule.assignToTeamId,
      },
    });

    return { assignedToTeamId: rule.assignToTeamId, assignedToUserId: assignedUserId };
  }

  /**
   * Get next user using round-robin algorithm
   */
  private async getRoundRobinUser(teamId: string): Promise<string | null> {
    if (!teamId) return null;

    const members = await this.prisma.teamMember.findMany({
      where: {
        teamId,
        isActive: true,
        user: { presence: { status: { in: ['ONLINE', 'BUSY'] } } },
      },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });

    if (members.length === 0) return null;

    // Simple round-robin: get member with least recent conversation assignment
    const lastAssignments = await this.prisma.conversation.findMany({
      where: {
        assignedToUserId: { in: members.map((m) => m.userId) },
      },
      orderBy: { updatedAt: 'desc' },
      distinct: ['assignedToUserId'],
    });

    const assignmentMap = new Map(lastAssignments.map((c) => [c.assignedToUserId, c.updatedAt]));

    // Find member with oldest assignment (or never assigned)
    let selectedMember = members[0];
    let oldestTime = assignmentMap.get(members[0].userId) || new Date(0);

    for (const member of members) {
      const memberTime = assignmentMap.get(member.userId) || new Date(0);
      if (memberTime < oldestTime) {
        oldestTime = memberTime;
        selectedMember = member;
      }
    }

    return selectedMember.userId;
  }

  /**
   * Get user with least active conversations
   */
  private async getLeastBusyUser(teamId: string): Promise<string | null> {
    if (!teamId) return null;

    const members = await this.prisma.teamMember.findMany({
      where: {
        teamId,
        isActive: true,
        user: { presence: { status: { in: ['ONLINE', 'BUSY'] } } },
      },
      include: {
        user: {
          include: {
            _count: {
              select: {
                assignedConversations: {
                  where: { status: { in: ['ACTIVE', 'PENDING'] } },
                },
              },
            },
          },
        },
      },
    });

    if (members.length === 0) return null;

    // Sort by active conversation count and check against maxConcurrentChats
    const sortedMembers = members
      .filter((m) => {
        const activeChats = m.user._count.assignedConversations;
        return !m.maxConcurrentChats || activeChats < m.maxConcurrentChats;
      })
      .sort((a, b) => {
        return a.user._count.assignedConversations - b.user._count.assignedConversations;
      });

    return sortedMembers.length > 0 ? sortedMembers[0].userId : null;
  }

  /**
   * Get user using load-balanced algorithm (considers capacity and current load)
   */
  private async getLoadBalancedUser(teamId: string): Promise<string | null> {
    if (!teamId) return null;

    const members = await this.prisma.teamMember.findMany({
      where: {
        teamId,
        isActive: true,
        user: { presence: { status: { in: ['ONLINE', 'BUSY'] } } },
      },
      include: {
        user: {
          include: {
            _count: {
              select: {
                assignedConversations: {
                  where: { status: { in: ['ACTIVE', 'PENDING'] } },
                },
              },
            },
          },
        },
      },
    });

    if (members.length === 0) return null;

    // Calculate load percentage for each member
    const membersWithLoad = members
      .map((m) => {
        const activeChats = m.user._count.assignedConversations;
        const capacity = m.maxConcurrentChats || 10; // Default capacity
        const loadPercentage = (activeChats / capacity) * 100;

        return {
          userId: m.userId,
          activeChats,
          capacity,
          loadPercentage,
        };
      })
      .filter((m) => m.loadPercentage < 100) // Exclude at-capacity members
      .sort((a, b) => a.loadPercentage - b.loadPercentage);

    return membersWithLoad.length > 0 ? membersWithLoad[0].userId : null;
  }
}

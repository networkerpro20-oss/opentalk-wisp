import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto, CampaignStatus } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, userId: string, createCampaignDto: CreateCampaignDto) {
    const campaign = await this.prisma.campaign.create({
      data: {
        name: createCampaignDto.name,
        description: createCampaignDto.description,
        targetSegment: createCampaignDto.targetSegment as any,
        messageTemplate: createCampaignDto.messageTemplate,
        mediaUrl: createCampaignDto.mediaUrl,
        scheduledAt: createCampaignDto.scheduledAt
          ? new Date(createCampaignDto.scheduledAt)
          : null,
        messagesPerMinute: createCampaignDto.messagesPerMinute || 10,
        status: createCampaignDto.scheduledAt ? CampaignStatus.SCHEDULED : CampaignStatus.DRAFT,
        organizationId,
        createdById: userId,
      },
    });

    this.logger.log(`Campaign created: ${campaign.id}`);
    return campaign;
  }

  async findAll(organizationId: string, status?: CampaignStatus) {
    return this.prisma.campaign.findMany({
      where: {
        organizationId,
        ...(status && { status }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            executions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, organizationId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        executions: {
          take: 100,
          orderBy: { createdAt: 'desc' },
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    return campaign;
  }

  async update(id: string, organizationId: string, updateCampaignDto: UpdateCampaignDto) {
    // Verify ownership
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, organizationId },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    return this.prisma.campaign.update({
      where: { id },
      data: {
        ...(updateCampaignDto.name && { name: updateCampaignDto.name }),
        ...(updateCampaignDto.description !== undefined && {
          description: updateCampaignDto.description,
        }),
        ...(updateCampaignDto.targetSegment && {
          targetSegment: updateCampaignDto.targetSegment as any,
        }),
        ...(updateCampaignDto.messageTemplate && {
          messageTemplate: updateCampaignDto.messageTemplate,
        }),
        ...(updateCampaignDto.mediaUrl !== undefined && {
          mediaUrl: updateCampaignDto.mediaUrl,
        }),
        ...(updateCampaignDto.scheduledAt !== undefined && {
          scheduledAt: updateCampaignDto.scheduledAt
            ? new Date(updateCampaignDto.scheduledAt)
            : null,
        }),
        ...(updateCampaignDto.messagesPerMinute && {
          messagesPerMinute: updateCampaignDto.messagesPerMinute,
        }),
      },
    });
  }

  async delete(id: string, organizationId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, organizationId },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    // Don't delete if running
    if (campaign.status === CampaignStatus.RUNNING) {
      throw new Error('Cannot delete a running campaign. Pause it first.');
    }

    return this.prisma.campaign.delete({ where: { id } });
  }

  async start(id: string, organizationId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, organizationId },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    if (campaign.status === CampaignStatus.RUNNING) {
      throw new Error('Campaign is already running');
    }

    // Update status
    await this.prisma.campaign.update({
      where: { id },
      data: {
        status: CampaignStatus.RUNNING,
        startedAt: new Date(),
      },
    });

    // Start sending messages in background
    this.processCampaign(id, organizationId);

    return { message: 'Campaign started' };
  }

  async pause(id: string, organizationId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, organizationId },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    return this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.PAUSED },
    });
  }

  async resume(id: string, organizationId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, organizationId },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    await this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.RUNNING },
    });

    // Resume processing
    this.processCampaign(id, organizationId);

    return { message: 'Campaign resumed' };
  }

  async getStats(id: string, organizationId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, organizationId },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    const executions = await this.prisma.campaignExecution.findMany({
      where: { campaignId: id },
    });

    const total = executions.length;
    const sent = executions.filter((e) => e.status === 'SENT').length;
    const delivered = executions.filter((e) => e.status === 'DELIVERED').length;
    const read = executions.filter((e) => e.status === 'READ').length;
    const replied = executions.filter((e) => e.repliedAt !== null).length;
    const failed = executions.filter((e) => e.status === 'FAILED').length;

    return {
      total,
      sent,
      delivered,
      read,
      replied,
      failed,
      replyRate: total > 0 ? ((replied / total) * 100).toFixed(2) : 0,
      deliveryRate: total > 0 ? ((delivered / total) * 100).toFixed(2) : 0,
    };
  }

  private async processCampaign(campaignId: string, organizationId: string) {
    this.logger.log(`Processing campaign: ${campaignId}`);

    try {
      const campaign = await this.prisma.campaign.findFirst({
        where: { id: campaignId, organizationId },
      });

      if (!campaign || campaign.status !== CampaignStatus.RUNNING) {
        return;
      }

      // Get target contacts based on segment filters
      const contacts = await this.getTargetContacts(
        organizationId,
        campaign.targetSegment as any,
      );

      this.logger.log(`Found ${contacts.length} contacts for campaign ${campaignId}`);

      // Get already sent executions
      const sentExecutions = await this.prisma.campaignExecution.findMany({
        where: { campaignId },
        select: { contactId: true },
      });

      const sentContactIds = new Set(sentExecutions.map((e) => e.contactId));

      // Filter contacts that haven't received the message yet
      const pendingContacts = contacts.filter((c) => !sentContactIds.has(c.id));

      this.logger.log(`Pending contacts: ${pendingContacts.length}`);

      // Send messages with rate limiting
      const messagesPerMinute = campaign.messagesPerMinute || 10;
      const delayMs = (60 * 1000) / messagesPerMinute;

      for (const contact of pendingContacts) {
        // Check if still running
        const currentCampaign = await this.prisma.campaign.findFirst({
          where: { id: campaignId },
        });

        if (currentCampaign?.status !== CampaignStatus.RUNNING) {
          this.logger.log(`Campaign ${campaignId} is no longer running. Stopping.`);
          break;
        }

        // Replace variables in template
        const message = this.replaceVariables(campaign.messageTemplate, contact);

        // Create execution record
        await this.prisma.campaignExecution.create({
          data: {
            campaignId,
            contactId: contact.id,
            status: 'PENDING',
          },
        });

        // TODO: Send actual WhatsApp message via WhatsApp service
        // For now, just log
        this.logger.log(`Would send to ${contact.phone}: ${message}`);

        // Simulate sending delay
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      // Mark campaign as completed
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: CampaignStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Campaign ${campaignId} completed`);
    } catch (error) {
      this.logger.error(`Error processing campaign ${campaignId}:`, error);
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: { status: CampaignStatus.PAUSED },
      });
    }
  }

  private async getTargetContacts(organizationId: string, segment: any) {
    // Parse segment filters and build query
    const where: any = { organizationId };

    if (segment.tags && segment.tags.length > 0) {
      where.tags = {
        some: {
          tagId: {
            in: segment.tags,
          },
        },
      };
    }

    if (segment.leadStatus) {
      where.leadStatus = segment.leadStatus;
    }

    if (segment.minLeadScore) {
      where.leadScore = {
        gte: segment.minLeadScore,
      };
    }

    return this.prisma.contact.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
      },
    });
  }

  private replaceVariables(template: string, contact: any): string {
    return template
      .replace(/{{name}}/g, contact.name || 'Cliente')
      .replace(/{{phoneNumber}}/g, contact.phone || '')
      .replace(/{{email}}/g, contact.email || '');
  }

  // Cron job to check for scheduled campaigns
  @Cron(CronExpression.EVERY_MINUTE)
  async checkScheduledCampaigns() {
    const now = new Date();

    const scheduledCampaigns = await this.prisma.campaign.findMany({
      where: {
        status: CampaignStatus.SCHEDULED,
        scheduledAt: {
          lte: now,
        },
      },
    });

    for (const campaign of scheduledCampaigns) {
      this.logger.log(`Auto-starting scheduled campaign: ${campaign.id}`);
      await this.start(campaign.id, campaign.organizationId);
    }
  }
}

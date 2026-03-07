import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';
import { CreateCampaignDto, CampaignStatus } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import OpenAI from 'openai';

export interface ABVariant {
  id: string;
  message: string;
  weight: number;
}

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);
  private openai: OpenAI | null = null;

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
    @Optional() private knowledgeBaseService?: KnowledgeBaseService,
  ) {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

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
        aiBrief: createCampaignDto.aiBrief,
        aiGeneratedText: createCampaignDto.aiGeneratedText,
        campaignMessageType: createCampaignDto.campaignMessageType || 'TEXT',
        audioUrl: createCampaignDto.audioUrl,
        ttsVoice: createCampaignDto.ttsVoice || 'alloy',
        variants: createCampaignDto.variants as any,
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
        ...(updateCampaignDto.aiBrief !== undefined && { aiBrief: updateCampaignDto.aiBrief }),
        ...(updateCampaignDto.aiGeneratedText !== undefined && { aiGeneratedText: updateCampaignDto.aiGeneratedText }),
        ...(updateCampaignDto.campaignMessageType && { campaignMessageType: updateCampaignDto.campaignMessageType }),
        ...(updateCampaignDto.audioUrl !== undefined && { audioUrl: updateCampaignDto.audioUrl }),
        ...(updateCampaignDto.ttsVoice && { ttsVoice: updateCampaignDto.ttsVoice }),
        ...(updateCampaignDto.variants !== undefined && { variants: updateCampaignDto.variants as any }),
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

        // Select variant if A/B testing
        let selectedVariant: ABVariant | null = null;
        let message: string;

        const variants = campaign.variants as ABVariant[] | null;
        if (variants && variants.length > 0) {
          selectedVariant = this.selectVariant(variants);
          message = this.replaceVariables(selectedVariant.message, contact);
        } else {
          message = this.replaceVariables(campaign.messageTemplate, contact);
        }

        // Create execution record
        await this.prisma.campaignExecution.create({
          data: {
            campaignId,
            contactId: contact.id,
            status: 'PENDING',
            variantId: selectedVariant?.id || null,
          },
        });

        // Send actual WhatsApp message
        try {
          const instance = await this.prisma.whatsAppInstance.findFirst({
            where: { organizationId, status: 'CONNECTED' },
          });

          if (instance && contact.phone) {
            if (campaign.campaignMessageType === 'AUDIO' && campaign.audioUrl) {
              // Send audio message
              await this.whatsappService.sendMedia(organizationId, {
                instanceId: instance.id,
                to: contact.phone,
                mediaUrl: campaign.audioUrl,
                type: 'audio' as any,
                caption: '',
              });
            } else {
              // Send text message
              await this.whatsappService.sendMessage(organizationId, {
                instanceId: instance.id,
                to: contact.phone,
                message,
              });
            }

            await this.prisma.campaignExecution.updateMany({
              where: { campaignId, contactId: contact.id },
              data: { status: 'SENT', sentAt: new Date() },
            });

            this.logger.log(`Campaign ${campaignId}: sent to ${contact.phone}`);
          } else {
            await this.prisma.campaignExecution.updateMany({
              where: { campaignId, contactId: contact.id },
              data: { status: 'FAILED', error: instance ? 'No phone number' : 'No connected WhatsApp instance' },
            });
          }
        } catch (sendError) {
          this.logger.error(`Campaign ${campaignId}: failed to send to ${contact.phone}: ${sendError.message}`);
          await this.prisma.campaignExecution.updateMany({
            where: { campaignId, contactId: contact.id },
            data: { status: 'FAILED', error: sendError.message },
          });
        }

        // Rate limiting delay
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

  /**
   * Select A/B variant using weighted random selection
   */
  private selectVariant(variants: ABVariant[]): ABVariant {
    const totalWeight = variants.reduce((sum, v) => sum + (v.weight || 1), 0);
    let random = Math.random() * totalWeight;
    for (const variant of variants) {
      random -= variant.weight || 1;
      if (random <= 0) return variant;
    }
    return variants[0];
  }

  /**
   * Generate campaign message using AI + KB context
   */
  async generateCampaignMessage(brief: string, organizationId: string): Promise<{
    message: string;
    variants?: ABVariant[];
  }> {
    if (!this.openai) {
      return { message: brief };
    }

    let kbContext = '';
    if (this.knowledgeBaseService) {
      const kbData = await this.knowledgeBaseService.buildKBContext(brief, organizationId);
      if (kbData?.context) {
        kbContext = `\n\nInformacion del negocio:\n${kbData.context}`;
      }
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Eres un experto en marketing por WhatsApp. Genera mensajes de campana efectivos.
${kbContext}

Reglas:
- Maximo 500 caracteres por mensaje
- Incluye llamado a la accion
- Usa variables {{name}} para personalizar
- Genera 3 variantes para A/B testing
- Responde en JSON:
{
  "message": "mensaje principal",
  "variants": [
    {"id": "A", "message": "variante A", "weight": 50},
    {"id": "B", "message": "variante B", "weight": 30},
    {"id": "C", "message": "variante C", "weight": 20}
  ]
}`,
          },
          { role: 'user', content: brief },
        ],
        temperature: 0.8,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return {
        message: result.message || brief,
        variants: result.variants,
      };
    } catch (error) {
      this.logger.error('Error generating campaign message:', error);
      return { message: brief };
    }
  }

  /**
   * Generate TTS audio from text using OpenAI
   */
  async generateAudio(text: string, voice: string = 'alloy'): Promise<Buffer> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    const selectedVoice = validVoices.includes(voice) ? voice : 'alloy';

    const response = await this.openai.audio.speech.create({
      model: 'tts-1',
      voice: selectedVoice as any,
      input: text.slice(0, 4096),
    });

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Get detailed analytics for a campaign including A/B variant performance
   */
  async getAnalytics(id: string, organizationId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, organizationId },
    });

    if (!campaign) throw new NotFoundException(`Campaign not found`);

    const executions = await this.prisma.campaignExecution.findMany({
      where: { campaignId: id },
    });

    const total = executions.length;
    const sent = executions.filter(e => e.status === 'SENT' || e.status === 'DELIVERED' || e.status === 'READ').length;
    const delivered = executions.filter(e => e.status === 'DELIVERED' || e.status === 'READ').length;
    const read = executions.filter(e => e.status === 'READ').length;
    const replied = executions.filter(e => e.repliedAt !== null).length;
    const failed = executions.filter(e => e.status === 'FAILED').length;

    // A/B variant stats
    const variantStats: Record<string, { sent: number; delivered: number; read: number; replied: number }> = {};
    for (const exec of executions) {
      if (exec.variantId) {
        if (!variantStats[exec.variantId]) {
          variantStats[exec.variantId] = { sent: 0, delivered: 0, read: 0, replied: 0 };
        }
        const vs = variantStats[exec.variantId];
        if (exec.status !== 'PENDING' && exec.status !== 'FAILED') vs.sent++;
        if (exec.status === 'DELIVERED' || exec.status === 'READ') vs.delivered++;
        if (exec.status === 'READ') vs.read++;
        if (exec.repliedAt) vs.replied++;
      }
    }

    // Timeline: group by hour
    const timeline: Record<string, number> = {};
    for (const exec of executions) {
      if (exec.sentAt) {
        const hour = exec.sentAt.toISOString().slice(0, 13);
        timeline[hour] = (timeline[hour] || 0) + 1;
      }
    }

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        campaignMessageType: campaign.campaignMessageType,
        startedAt: campaign.startedAt,
        completedAt: campaign.completedAt,
      },
      metrics: {
        total,
        sent,
        delivered,
        read,
        replied,
        failed,
        deliveryRate: total > 0 ? ((delivered / total) * 100).toFixed(1) : '0',
        readRate: delivered > 0 ? ((read / delivered) * 100).toFixed(1) : '0',
        replyRate: sent > 0 ? ((replied / sent) * 100).toFixed(1) : '0',
      },
      variantStats,
      timeline: Object.entries(timeline).map(([hour, count]) => ({ hour, count })),
    };
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

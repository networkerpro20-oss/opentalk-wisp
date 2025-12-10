import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

export interface FlowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'ai' | 'wait' | 'end';
  data: any;
  position: { x: number; y: number };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface FlowExecutionContext {
  flowId: string;
  contactId?: string;
  conversationId?: string;
  messageId?: string;
  organizationId: string;
  variables: Record<string, any>;
}

@Injectable()
export class FlowEngineService {
  private readonly logger = new Logger(FlowEngineService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private whatsappService: WhatsappService,
  ) {}

  /**
   * Ejecutar un flow completo
   */
  async executeFlow(
    flowId: string,
    context: FlowExecutionContext,
  ): Promise<void> {
    try {
      this.logger.log(`Starting flow execution: ${flowId}`);

      const flow = await this.prisma.flow.findUnique({
        where: { id: flowId },
      });

      if (!flow || flow.status !== 'ACTIVE') {
        this.logger.warn(`Flow ${flowId} not found or inactive`);
        return;
      }

      const config = flow.config as any;
      const nodes = (config?.nodes || []) as FlowNode[];
      const edges = (config?.edges || []) as FlowEdge[];

      // Encontrar nodo inicial (trigger)
      const startNode = nodes.find(node => node.type === 'trigger');
      if (!startNode) {
        this.logger.error(`No trigger node found in flow ${flowId}`);
        return;
      }

      // Ejecutar desde el nodo inicial
      await this.executeNode(startNode, nodes, edges, context);

      this.logger.log(`Flow execution completed: ${flowId}`);
    } catch (error) {
      this.logger.error(`Error executing flow ${flowId}:`, error);
      throw error;
    }
  }

  /**
   * Ejecutar un nodo específico
   */
  private async executeNode(
    node: FlowNode,
    allNodes: FlowNode[],
    allEdges: FlowEdge[],
    context: FlowExecutionContext,
  ): Promise<void> {
    this.logger.log(`Executing node: ${node.id} (${node.type})`);

    try {
      let nextNodeId: string | null = null;

      switch (node.type) {
        case 'trigger':
          // El trigger ya se ejecutó, pasar al siguiente
          nextNodeId = this.getNextNodeId(node.id, allEdges);
          break;

        case 'condition':
          nextNodeId = await this.executeConditionNode(node, context, allEdges);
          break;

        case 'action':
          await this.executeActionNode(node, context);
          nextNodeId = this.getNextNodeId(node.id, allEdges);
          break;

        case 'ai':
          await this.executeAiNode(node, context);
          nextNodeId = this.getNextNodeId(node.id, allEdges);
          break;

        case 'wait':
          await this.executeWaitNode(node, context);
          nextNodeId = this.getNextNodeId(node.id, allEdges);
          break;

        case 'end':
          this.logger.log('Flow execution reached end node');
          return;
      }

      // Ejecutar siguiente nodo
      if (nextNodeId) {
        const nextNode = allNodes.find(n => n.id === nextNodeId);
        if (nextNode) {
          await this.executeNode(nextNode, allNodes, allEdges, context);
        }
      }
    } catch (error) {
      this.logger.error(`Error executing node ${node.id}:`, error);
      throw error;
    }
  }

  /**
   * Ejecutar nodo de condición
   */
  private async executeConditionNode(
    node: FlowNode,
    context: FlowExecutionContext,
    allEdges: FlowEdge[],
  ): Promise<string | null> {
    const { condition, field, operator, value } = node.data;

    let result = false;

    // Evaluar condición
    const contextValue = context.variables[field];

    switch (operator) {
      case 'equals':
        result = contextValue === value;
        break;
      case 'contains':
        result = String(contextValue).includes(value);
        break;
      case 'greater_than':
        result = Number(contextValue) > Number(value);
        break;
      case 'less_than':
        result = Number(contextValue) < Number(value);
        break;
      case 'is_empty':
        result = !contextValue || contextValue === '';
        break;
    }

    // Encontrar edge basado en el resultado
    const edge = allEdges.find(
      e => e.source === node.id && e.sourceHandle === (result ? 'true' : 'false'),
    );

    return edge?.target || null;
  }

  /**
   * Ejecutar nodo de acción
   */
  private async executeActionNode(
    node: FlowNode,
    context: FlowExecutionContext,
  ): Promise<void> {
    const { action, data } = node.data;

    switch (action) {
      case 'send_message':
        await this.sendWhatsAppMessage(data.message, context);
        break;

      case 'send_media':
        await this.sendWhatsAppMedia(data, context);
        break;

      case 'add_tag':
        await this.addContactTag(data.tag, context);
        break;

      case 'create_deal':
        await this.createDeal(data, context);
        break;

      case 'assign_user':
        await this.assignToUser(data.userId, context);
        break;

      case 'update_field':
        await this.updateContactField(data.field, data.value, context);
        break;
    }
  }

  /**
   * Ejecutar nodo de IA
   */
  private async executeAiNode(
    node: FlowNode,
    context: FlowExecutionContext,
  ): Promise<void> {
    const { aiAction, data } = node.data;

    switch (aiAction) {
      case 'analyze_sentiment':
        if (context.messageId) {
          const message = await this.prisma.message.findUnique({
            where: { id: context.messageId },
          });
          if (message) {
            const sentiment = await this.aiService.analyzeSentiment(message.content);
            context.variables.sentiment = sentiment.sentiment;
            context.variables.sentimentScore = sentiment.score;
          }
        }
        break;

      case 'generate_response':
        if (context.messageId) {
          const message = await this.prisma.message.findUnique({
            where: { id: context.messageId },
          });
          if (message) {
            const response = await this.aiService.generateAutoResponse(message.content);
            context.variables.aiResponse = response.response;
            
            // Auto-enviar si confidence es alta
            if (response.confidence > 0.7 && !response.needsHumanReview) {
              await this.sendWhatsAppMessage(response.response, context);
            }
          }
        }
        break;

      case 'calculate_lead_score':
        if (context.contactId) {
          const score = await this.aiService.calculateLeadScore(context.contactId);
          context.variables.leadScore = score.score;
          context.variables.leadCategory = score.category;
        }
        break;

      case 'extract_info':
        if (context.messageId) {
          const message = await this.prisma.message.findUnique({
            where: { id: context.messageId },
          });
          if (message) {
            const info = await this.aiService.extractContactInfo(message.content);
            context.variables.extractedInfo = info;
            
            // Actualizar contacto con la info extraída
            if (context.contactId && (info.name || info.email || info.phone)) {
              await this.prisma.contact.update({
                where: { id: context.contactId },
                data: {
                  name: info.name || undefined,
                  email: info.email || undefined,
                  phone: info.phone || undefined,
                },
              });
            }
          }
        }
        break;
    }
  }

  /**
   * Ejecutar nodo de espera
   */
  private async executeWaitNode(
    node: FlowNode,
    context: FlowExecutionContext,
  ): Promise<void> {
    const { duration, unit } = node.data;

    let milliseconds = 0;
    switch (unit) {
      case 'seconds':
        milliseconds = duration * 1000;
        break;
      case 'minutes':
        milliseconds = duration * 60 * 1000;
        break;
      case 'hours':
        milliseconds = duration * 60 * 60 * 1000;
        break;
      case 'days':
        milliseconds = duration * 24 * 60 * 60 * 1000;
        break;
    }

    this.logger.log(`Waiting for ${duration} ${unit}`);
    await new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  /**
   * Helpers
   */
  private getNextNodeId(currentNodeId: string, edges: FlowEdge[]): string | null {
    const edge = edges.find(e => e.source === currentNodeId);
    return edge?.target || null;
  }

  private async sendWhatsAppMessage(message: string, context: FlowExecutionContext): Promise<void> {
    if (!context.conversationId) return;

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: context.conversationId },
      include: { contact: true, whatsappInstance: true },
    });

    if (conversation?.whatsappInstance && conversation.contact.phone) {
      await this.whatsappService.sendMessage(context.organizationId, {
        instanceId: conversation.whatsappInstance.id,
        to: conversation.contact.phone,
        message: this.replaceVariables(message, context.variables),
      });
    }
  }

  private async sendWhatsAppMedia(data: any, context: FlowExecutionContext): Promise<void> {
    if (!context.conversationId) return;

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: context.conversationId },
      include: { contact: true, whatsappInstance: true },
    });

    if (conversation?.whatsappInstance && conversation.contact.phone) {
      await this.whatsappService.sendMedia(context.organizationId, {
        instanceId: conversation.whatsappInstance.id,
        to: conversation.contact.phone,
        type: data.mediaType,
        mediaUrl: data.mediaUrl,
        caption: this.replaceVariables(data.caption || '', context.variables),
        fileName: data.fileName,
        mimeType: data.mimeType,
      });
    }
  }

  private async addContactTag(tag: string, context: FlowExecutionContext): Promise<void> {
    if (!context.contactId) return;

    // Buscar o crear el tag
    let tagRecord = await this.prisma.tag.findFirst({
      where: { 
        name: tag,
        organizationId: context.organizationId,
      },
    });

    if (!tagRecord) {
      tagRecord = await this.prisma.tag.create({
        data: {
          name: tag,
          color: '#3B82F6', // Color azul por defecto
          organizationId: context.organizationId,
        },
      });
    }

    // Crear la relación contact-tag si no existe
    const existing = await this.prisma.contactTag.findUnique({
      where: {
        contactId_tagId: {
          contactId: context.contactId,
          tagId: tagRecord.id,
        },
      },
    });

    if (!existing) {
      await this.prisma.contactTag.create({
        data: {
          contactId: context.contactId,
          tagId: tagRecord.id,
        },
      });
    }
  }

  private async createDeal(data: any, context: FlowExecutionContext): Promise<void> {
    if (!context.contactId) return;

    // TODO: Implementar con pipeline y stage correctos
    // Por ahora solo registramos el intento
    this.logger.log(`Would create deal: ${data.title} for contact ${context.contactId}`);
    // await this.prisma.deal.create({
    //   data: {
    //     title: this.replaceVariables(data.title, context.variables),
    //     value: data.value || 0,
    //     stageId: data.stageId,
    //     pipelineId: data.pipelineId,
    //     contactId: context.contactId,
    //     organizationId: context.organizationId,
    //   },
    // });
  }

  private async assignToUser(userId: string, context: FlowExecutionContext): Promise<void> {
    if (!context.conversationId) return;

    await this.prisma.conversation.update({
      where: { id: context.conversationId },
      data: { assignedToId: userId },
    });
  }

  private async updateContactField(
    field: string,
    value: any,
    context: FlowExecutionContext,
  ): Promise<void> {
    if (!context.contactId) return;

    await this.prisma.contact.update({
      where: { id: context.contactId },
      data: { [field]: this.replaceVariables(value, context.variables) },
    });
  }

  private replaceVariables(text: string, variables: Record<string, any>): string {
    let result = text;
    Object.keys(variables).forEach(key => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(variables[key]));
    });
    return result;
  }

  /**
   * Ejecutar flows basados en trigger
   */
  async executeTrigger(
    trigger: string,
    organizationId: string,
    context: Partial<FlowExecutionContext>,
  ): Promise<void> {
    const flows = await this.prisma.flow.findMany({
      where: {
        organizationId,
        trigger: trigger as any,
        status: 'ACTIVE',
      },
    });

    for (const flow of flows) {
      const fullContext: FlowExecutionContext = {
        flowId: flow.id,
        organizationId,
        variables: {},
        ...context,
      };

      await this.executeFlow(flow.id, fullContext);
    }
  }
}

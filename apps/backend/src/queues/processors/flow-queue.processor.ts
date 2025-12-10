import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { FlowEngineService } from '../../flows/flow-engine.service';
import { FlowsService } from '../../flows/flows.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

export interface FlowTriggerJob {
  messageId: number;
  from: string;
  content: string;
  organizationId: number;
}

export interface FlowExecutionJob {
  flowId: number;
  conversationId: number;
  messageId: number;
  organizationId: number;
  context: Record<string, any>;
}

@Processor('flow-execution')
export class FlowQueueProcessor {
  private readonly logger = new Logger(FlowQueueProcessor.name);

  constructor(
    private readonly flowEngineService: FlowEngineService,
    private readonly flowsService: FlowsService,
    @InjectQueue('whatsapp-messages') private whatsappQueue: Queue,
    @InjectQueue('ai-processing') private aiQueue: Queue,
  ) {}

  @Process({
    name: 'check-triggers',
    concurrency: 5,
  })
  async handleTriggerCheck(job: Job<FlowTriggerJob>) {
    this.logger.log(`Checking flow triggers for message ${job.data.messageId}`);

    try {
      const { messageId, from, content, organizationId } = job.data;

      // Buscar flows activos para esta organización
      const activeFlows = await this.flowsService.findActiveFlows(organizationId);

      await job.updateProgress(30);

      // Verificar qué flows se deben ejecutar
      const triggeredFlows = activeFlows.filter((flow) => {
        return this.shouldTriggerFlow(flow, content);
      });

      await job.updateProgress(60);

      // Agregar jobs de ejecución para cada flow triggered
      for (const flow of triggeredFlows) {
        await this.whatsappQueue.add('execute-flow', {
          flowId: flow.id,
          conversationId: job.data.messageId, // Simplificado
          messageId,
          organizationId,
          context: {
            messageContent: content,
            from,
          },
        }, {
          priority: 2,
        });
      }

      await job.updateProgress(100);

      return {
        success: true,
        triggeredFlowsCount: triggeredFlows.length,
        flowIds: triggeredFlows.map(f => f.id),
      };
    } catch (error) {
      this.logger.error(`Error checking triggers: ${error.message}`);
      throw error;
    }
  }

  @Process({
    name: 'execute-flow',
    concurrency: 3,
  })
  async handleFlowExecution(job: Job<FlowExecutionJob>) {
    this.logger.log(`Executing flow ${job.data.flowId}`);

    try {
      const { flowId, conversationId, messageId, organizationId, context } = job.data;

      // Obtener flow completo
      const flow = await this.flowsService.findOne(flowId);
      
      if (!flow || !flow.isActive) {
        throw new Error(`Flow ${flowId} not found or inactive`);
      }

      await job.updateProgress(20);

      // Ejecutar flow usando el FlowEngine
      const executionResult = await this.flowEngineService.executeFlow(
        flow,
        context,
      );

      await job.updateProgress(80);

      // Procesar acciones resultantes
      for (const action of executionResult.actions) {
        await this.processFlowAction(action, conversationId, organizationId);
      }

      await job.updateProgress(100);

      return {
        success: true,
        flowId,
        actionsExecuted: executionResult.actions.length,
        executionTime: executionResult.executionTime,
      };
    } catch (error) {
      this.logger.error(`Error executing flow: ${error.message}`);
      throw error;
    }
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(`Processing flow job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Flow job ${job.id} completed`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Flow job ${job.id} failed: ${error.message}`);
  }

  private shouldTriggerFlow(flow: any, messageContent: string): boolean {
    // Lógica simplificada - verificar trigger
    if (!flow.trigger) return false;

    switch (flow.trigger.type) {
      case 'keyword':
        return messageContent.toLowerCase().includes(flow.trigger.value.toLowerCase());
      case 'exact_match':
        return messageContent.toLowerCase() === flow.trigger.value.toLowerCase();
      case 'regex':
        const regex = new RegExp(flow.trigger.value, 'i');
        return regex.test(messageContent);
      default:
        return false;
    }
  }

  private async processFlowAction(action: any, conversationId: number, organizationId: number) {
    switch (action.type) {
      case 'send_message':
        await this.whatsappQueue.add('send-outgoing', {
          to: action.to,
          message: action.message,
          organizationId,
        }, {
          priority: 3,
        });
        break;

      case 'ai_response':
        await this.aiQueue.add('generate-response', {
          conversationId,
          prompt: action.prompt,
          organizationId,
        }, {
          priority: 4,
        });
        break;

      case 'add_tag':
        // Lógica para agregar tags
        this.logger.log(`Adding tag: ${action.tag}`);
        break;

      default:
        this.logger.warn(`Unknown action type: ${action.type}`);
    }
  }
}

import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { FlowsService } from '../../flows/flows.service';
import { FlowEngineService } from '../../flows/flow-engine.service';

interface FlowTriggerJob {
  organizationId: string;
  conversationId: string;
  messageContent: string;
  contactId: string;
}

interface FlowExecutionJob {
  flowId: string;
  conversationId: string;
  organizationId: string;
  context: any;
}

@Processor('flow-execution')
export class FlowQueueProcessor {
  private readonly logger = new Logger(FlowQueueProcessor.name);

  constructor(
    private flowsService: FlowsService,
    private flowEngineService: FlowEngineService,
    @InjectQueue('whatsapp-messages') private whatsappQueue: Queue,
  ) {}

  @Process({
    name: 'check-triggers',
    concurrency: 5,
  })
  async handleFlowTriggerCheck(job: Job<FlowTriggerJob>) {
    this.logger.log(`Checking flow triggers for org ${job.data.organizationId}`);

    try {
      const { organizationId, messageContent, conversationId, contactId } = job.data;

      // Buscar flows activos
      const flows = await this.flowsService.findAll(organizationId);
      const activeFlows = flows.filter(f => f.status === 'ACTIVE');

      this.logger.log(`Found ${activeFlows.length} active flows`);

      // Por ahora solo logear
      return {
        success: true,
        flowsChecked: activeFlows.length,
      };
    } catch (error) {
      this.logger.error(`Error checking flow triggers: ${error.message}`);
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
      const { flowId, conversationId, organizationId, context } = job.data;

      // Obtener flow
      const flow = await this.flowsService.findOne(flowId, organizationId);
      
      if (!flow || flow.status !== 'ACTIVE') {
        throw new Error(`Flow ${flowId} not found or inactive`);
      }

      this.logger.log(`Flow "${flow.name}" ready for execution`);

      // Ejecutar flow
      await this.flowEngineService.executeFlow(flowId, context);

      return {
        success: true,
        flowId,
        flowName: flow.name,
      };
    } catch (error) {
      this.logger.error(`Error executing flow: ${error.message}`);
      throw error;
    }
  }
}

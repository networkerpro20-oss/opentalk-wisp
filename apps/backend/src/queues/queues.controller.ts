import { Controller, Get, Req, Res } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Request, Response } from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';

@Controller('admin/queues')
export class QueuesController {
  private serverAdapter: ExpressAdapter;

  constructor(
    @InjectQueue('whatsapp-messages') private whatsappQueue: Queue,
    @InjectQueue('media-processing') private mediaQueue: Queue,
    @InjectQueue('flow-execution') private flowQueue: Queue,
    @InjectQueue('ai-processing') private aiQueue: Queue,
  ) {
    this.serverAdapter = new ExpressAdapter();
    this.serverAdapter.setBasePath('/admin/queues');

    createBullBoard({
      queues: [
        new BullAdapter(this.whatsappQueue),
        new BullAdapter(this.mediaQueue),
        new BullAdapter(this.flowQueue),
        new BullAdapter(this.aiQueue),
      ],
      serverAdapter: this.serverAdapter,
    });
  }

  @Get('*')
  async getQueues(@Req() req: Request, @Res() res: Response) {
    const basePath = '/admin/queues';
    const path = req.path.replace(basePath, '') || '/';
    
    // @ts-ignore
    return this.serverAdapter.getRouter()(req, res);
  }

  @Get('stats')
  async getStats() {
    const [whatsappStats, mediaStats, flowStats, aiStats] = await Promise.all([
      this.getQueueStats(this.whatsappQueue),
      this.getQueueStats(this.mediaQueue),
      this.getQueueStats(this.flowQueue),
      this.getQueueStats(this.aiQueue),
    ]);

    return {
      whatsapp: whatsappStats,
      media: mediaStats,
      flows: flowStats,
      ai: aiStats,
      timestamp: new Date().toISOString(),
    };
  }

  private async getQueueStats(queue: Queue) {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }
}

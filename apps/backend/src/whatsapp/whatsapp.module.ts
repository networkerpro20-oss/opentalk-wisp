import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { AiModule } from '../ai/ai.module';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [
    PrismaModule,
    EventsModule,
    forwardRef(() => AiModule),
    forwardRef(() => KnowledgeBaseModule),
    WebhooksModule,
    BullModule.registerQueue(
      { name: 'flow-execution' },
      { name: 'ai-processing' },
    ),
  ],
  controllers: [WhatsappController],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule {}

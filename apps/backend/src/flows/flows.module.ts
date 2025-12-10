import { Module, forwardRef } from '@nestjs/common';
import { FlowsService } from './flows.service';
import { FlowsController } from './flows.controller';
import { FlowEngineService } from './flow-engine.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [PrismaModule, AiModule, forwardRef(() => WhatsappModule)],
  controllers: [FlowsController],
  providers: [
    FlowsService,
    FlowEngineService,
    {
      provide: 'FlowEngineService',
      useExisting: FlowEngineService,
    },
  ],
  exports: [FlowsService, FlowEngineService, 'FlowEngineService'],
})
export class FlowsModule {}

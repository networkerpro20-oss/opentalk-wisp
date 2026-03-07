import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { KnowledgeBaseService } from './knowledge-base.service';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { ContentExtractorService } from './content-extractor.service';

@Module({
  imports: [PrismaModule],
  controllers: [KnowledgeBaseController],
  providers: [KnowledgeBaseService, ContentExtractorService],
  exports: [KnowledgeBaseService],
})
export class KnowledgeBaseModule {}

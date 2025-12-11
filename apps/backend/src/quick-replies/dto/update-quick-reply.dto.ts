import { PartialType } from '@nestjs/swagger';
import { CreateQuickReplyDto } from './create-quick-reply.dto';

export class UpdateQuickReplyDto extends PartialType(CreateQuickReplyDto) {}

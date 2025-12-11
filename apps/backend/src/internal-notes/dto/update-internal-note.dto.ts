import { PartialType } from '@nestjs/swagger';
import { CreateInternalNoteDto } from './create-internal-note.dto';
import { OmitType } from '@nestjs/swagger';

export class UpdateInternalNoteDto extends PartialType(
  OmitType(CreateInternalNoteDto, ['conversationId'] as const),
) {}

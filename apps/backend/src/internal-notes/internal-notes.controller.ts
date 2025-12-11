import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InternalNotesService } from './internal-notes.service';
import { CreateInternalNoteDto } from './dto/create-internal-note.dto';
import { UpdateInternalNoteDto } from './dto/update-internal-note.dto';

@ApiTags('internal-notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('internal-notes')
export class InternalNotesController {
  constructor(private readonly internalNotesService: InternalNotesService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createInternalNoteDto: CreateInternalNoteDto) {
    return this.internalNotesService.create(user.id, user.organizationId, createInternalNoteDto);
  }

  @Get('conversation/:conversationId')
  findByConversation(@CurrentUser() user: any, @Param('conversationId') conversationId: string) {
    return this.internalNotesService.findByConversation(conversationId, user.organizationId);
  }

  @Get('user/:userId')
  findByUser(@CurrentUser() user: any, @Param('userId') userId: string) {
    return this.internalNotesService.findByUser(userId, user.organizationId);
  }

  @Get('my-notes')
  findMyNotes(@CurrentUser() user: any) {
    return this.internalNotesService.findByUser(user.id, user.organizationId);
  }

  @Get('search')
  @ApiQuery({ name: 'q', required: true })
  search(@CurrentUser() user: any, @Query('q') query: string) {
    return this.internalNotesService.search(user.organizationId, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.internalNotesService.findOne(id, user.organizationId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateInternalNoteDto: UpdateInternalNoteDto,
  ) {
    return this.internalNotesService.update(id, user.id, user.organizationId, updateInternalNoteDto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.internalNotesService.remove(id, user.id, user.organizationId);
  }
}

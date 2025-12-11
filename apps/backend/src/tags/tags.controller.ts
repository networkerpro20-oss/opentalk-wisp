import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags as ApiTagsDecorator } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { AssignTagsDto } from './dto/assign-tags.dto';

@ApiTagsDecorator('tags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(user.organizationId, createTagDto);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.tagsService.findAll(user.organizationId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tagsService.findOne(id, user.organizationId);
  }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
    return this.tagsService.update(id, user.organizationId, updateTagDto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tagsService.remove(id, user.organizationId);
  }

  // Contact tag operations
  @Post('contact/:contactId/assign')
  assignToContact(
    @CurrentUser() user: any,
    @Param('contactId') contactId: string,
    @Body() assignTagsDto: AssignTagsDto,
  ) {
    return this.tagsService.assignToContact(contactId, user.organizationId, assignTagsDto.tagIds);
  }

  @Get('contact/:contactId')
  getContactTags(@CurrentUser() user: any, @Param('contactId') contactId: string) {
    return this.tagsService.getContactTags(contactId, user.organizationId);
  }

  @Delete('contact/:contactId/:tagId')
  removeFromContact(
    @CurrentUser() user: any,
    @Param('contactId') contactId: string,
    @Param('tagId') tagId: string,
  ) {
    return this.tagsService.removeFromContact(contactId, tagId, user.organizationId);
  }

  // Conversation tag operations
  @Post('conversation/:conversationId/assign')
  assignToConversation(
    @CurrentUser() user: any,
    @Param('conversationId') conversationId: string,
    @Body() assignTagsDto: AssignTagsDto,
  ) {
    return this.tagsService.assignToConversation(
      conversationId,
      user.organizationId,
      assignTagsDto.tagIds,
    );
  }

  @Get('conversation/:conversationId')
  getConversationTags(@CurrentUser() user: any, @Param('conversationId') conversationId: string) {
    return this.tagsService.getConversationTags(conversationId, user.organizationId);
  }

  @Delete('conversation/:conversationId/:tagId')
  removeFromConversation(
    @CurrentUser() user: any,
    @Param('conversationId') conversationId: string,
    @Param('tagId') tagId: string,
  ) {
    return this.tagsService.removeFromConversation(conversationId, tagId, user.organizationId);
  }

  // Filter by tag
  @Get(':id/contacts')
  getContactsByTag(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tagsService.getContactsByTag(id, user.organizationId);
  }

  @Get(':id/conversations')
  getConversationsByTag(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tagsService.getConversationsByTag(id, user.organizationId);
  }
}

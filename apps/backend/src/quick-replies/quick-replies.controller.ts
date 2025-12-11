import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { QuickRepliesService } from './quick-replies.service';
import { CreateQuickReplyDto } from './dto/create-quick-reply.dto';
import { UpdateQuickReplyDto } from './dto/update-quick-reply.dto';

@ApiTags('quick-replies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quick-replies')
export class QuickRepliesController {
  constructor(private readonly quickRepliesService: QuickRepliesService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createQuickReplyDto: CreateQuickReplyDto) {
    return this.quickRepliesService.create(user.id, user.organizationId, createQuickReplyDto);
  }

  @Get()
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAll(@CurrentUser() user: any, @Query('isActive') isActive?: string) {
    const activeFilter = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.quickRepliesService.findAll(user.organizationId, activeFilter);
  }

  @Get('search')
  @ApiQuery({ name: 'q', required: true })
  search(@CurrentUser() user: any, @Query('q') query: string) {
    return this.quickRepliesService.search(user.organizationId, query);
  }

  @Get('shortcut/:shortcut')
  getByShortcut(@CurrentUser() user: any, @Param('shortcut') shortcut: string) {
    return this.quickRepliesService.getByShortcut(user.organizationId, shortcut);
  }

  @Get('tags')
  @ApiQuery({ name: 'tags', required: true, type: [String] })
  findByTags(@CurrentUser() user: any, @Query('tags') tags: string | string[]) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    return this.quickRepliesService.findByTags(user.organizationId, tagArray);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.quickRepliesService.findOne(id, user.organizationId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateQuickReplyDto: UpdateQuickReplyDto,
  ) {
    return this.quickRepliesService.update(id, user.organizationId, updateQuickReplyDto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.quickRepliesService.remove(id, user.organizationId);
  }
}

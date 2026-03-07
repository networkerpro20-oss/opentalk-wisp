import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { KnowledgeBaseService } from './knowledge-base.service';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import { CreateKnowledgeItemDto, GenerateFromUrlDto, GenerateFromWizardDto } from './dto/create-knowledge-item.dto';

@ApiTags('Knowledge Base')
@Controller('knowledge-base')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class KnowledgeBaseController {
  constructor(private readonly kbService: KnowledgeBaseService) {}

  @Get()
  @ApiOperation({ summary: 'Get organization knowledge base config' })
  async getKB(@Request() req) {
    return this.kbService.getOrCreateKB(req.user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Create or update knowledge base config' })
  async createOrUpdateKB(@Request() req, @Body() dto: CreateKnowledgeBaseDto) {
    return this.kbService.getOrCreateKB(req.user.organizationId, dto);
  }

  @Patch()
  @ApiOperation({ summary: 'Update knowledge base config' })
  async updateKB(@Request() req, @Body() dto: CreateKnowledgeBaseDto) {
    return this.kbService.updateKB(req.user.organizationId, dto);
  }

  // ---- Items ----

  @Post('items')
  @ApiOperation({ summary: 'Add manual knowledge item' })
  async addItem(@Request() req, @Body() dto: CreateKnowledgeItemDto) {
    return this.kbService.addItem(req.user.organizationId, dto);
  }

  @Post('items/from-url')
  @ApiOperation({ summary: 'Generate knowledge items from URL' })
  async generateFromUrl(@Request() req, @Body() dto: GenerateFromUrlDto) {
    return this.kbService.generateFromUrl(req.user.organizationId, dto.url);
  }

  @Post('items/from-document')
  @ApiOperation({ summary: 'Generate knowledge items from document (PDF/TXT)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async generateFromDocument(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No se proporcionó archivo');
    }
    return this.kbService.generateFromDocument(
      req.user.organizationId,
      file.buffer,
      file.originalname,
    );
  }

  @Post('items/from-wizard')
  @ApiOperation({ summary: 'Generate knowledge items from wizard Q&A' })
  async generateFromWizard(@Request() req, @Body() dto: GenerateFromWizardDto) {
    return this.kbService.generateFromWizard(req.user.organizationId, dto);
  }

  @Get('items')
  @ApiOperation({ summary: 'List knowledge items' })
  async listItems(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.kbService.listItems(req.user.organizationId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      category,
      search,
    });
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update knowledge item' })
  async updateItem(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: Partial<CreateKnowledgeItemDto>,
  ) {
    return this.kbService.updateItem(req.user.organizationId, id, dto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Delete knowledge item' })
  async deleteItem(@Request() req, @Param('id') id: string) {
    return this.kbService.deleteItem(req.user.organizationId, id);
  }

  @Post('test-response')
  @ApiOperation({ summary: 'Test AI response with KB context' })
  async testResponse(@Request() req, @Body() body: { message: string }) {
    const kbContext = await this.kbService.buildKBContext(body.message, req.user.organizationId);
    return {
      query: body.message,
      kbContext: kbContext?.context || 'Sin contexto de KB disponible',
      personality: kbContext?.personality || 'PROFESSIONAL',
      itemsFound: kbContext?.context ? kbContext.context.split('\n\n').length : 0,
    };
  }
}

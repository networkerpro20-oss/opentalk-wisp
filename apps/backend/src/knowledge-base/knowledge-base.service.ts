import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContentExtractorService } from './content-extractor.service';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import { CreateKnowledgeItemDto, GenerateFromWizardDto } from './dto/create-knowledge-item.dto';
import OpenAI from 'openai';

interface GeneratedKBEntry {
  title: string;
  content: string;
  category: string;
  keywords: string[];
  priority: number;
}

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);
  private openai: OpenAI | null = null;

  constructor(
    private prisma: PrismaService,
    private contentExtractor: ContentExtractorService,
  ) {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  private getOpenAI(customApiKey?: string): OpenAI | null {
    if (customApiKey) {
      return new OpenAI({ apiKey: customApiKey });
    }
    return this.openai;
  }

  /**
   * Get or create the KB for an organization
   */
  async getOrCreateKB(organizationId: string, dto?: CreateKnowledgeBaseDto) {
    let kb = await this.prisma.knowledgeBase.findUnique({
      where: { organizationId },
      include: { _count: { select: { items: true } } },
    });

    if (!kb) {
      kb = await this.prisma.knowledgeBase.create({
        data: {
          organizationId,
          name: dto?.name || 'Base de Conocimiento',
          description: dto?.description,
          systemPrompt: dto?.systemPrompt,
          personality: (dto?.personality as any) || 'PROFESSIONAL',
          confidenceThreshold: dto?.confidenceThreshold ?? 0.7,
          autoResponseEnabled: dto?.autoResponseEnabled ?? false,
          outsideHoursMessage: dto?.outsideHoursMessage,
        },
        include: { _count: { select: { items: true } } },
      });
    }

    return kb;
  }

  /**
   * Update KB configuration
   */
  async updateKB(organizationId: string, dto: CreateKnowledgeBaseDto) {
    const kb = await this.getOrCreateKB(organizationId);
    return this.prisma.knowledgeBase.update({
      where: { id: kb.id },
      data: {
        name: dto.name,
        description: dto.description,
        systemPrompt: dto.systemPrompt,
        personality: dto.personality as any,
        confidenceThreshold: dto.confidenceThreshold,
        autoResponseEnabled: dto.autoResponseEnabled,
        outsideHoursMessage: dto.outsideHoursMessage,
      },
      include: { _count: { select: { items: true } } },
    });
  }

  /**
   * Add a manual KB item
   */
  async addItem(organizationId: string, dto: CreateKnowledgeItemDto) {
    const kb = await this.getOrCreateKB(organizationId);
    return this.prisma.knowledgeItem.create({
      data: {
        knowledgeBaseId: kb.id,
        title: dto.title,
        content: dto.content,
        category: dto.category,
        priority: dto.priority ?? 5,
        keywords: dto.keywords ?? [],
        sourceType: 'MANUAL',
      },
    });
  }

  /**
   * Generate KB items from a URL
   */
  async generateFromUrl(organizationId: string, url: string) {
    const kb = await this.getOrCreateKB(organizationId);
    const extractedText = await this.contentExtractor.extractFromUrl(url);
    const entries = await this.generateKBEntries(extractedText, kb.customApiKey);

    const items = await Promise.all(
      entries.map(entry =>
        this.prisma.knowledgeItem.create({
          data: {
            knowledgeBaseId: kb.id,
            title: entry.title,
            content: entry.content,
            category: entry.category,
            priority: entry.priority,
            keywords: entry.keywords,
            sourceType: 'URL',
            sourceUrl: url,
          },
        }),
      ),
    );

    return { items, count: items.length };
  }

  /**
   * Generate KB items from a document (PDF/TXT)
   */
  async generateFromDocument(organizationId: string, buffer: Buffer, fileName: string) {
    const kb = await this.getOrCreateKB(organizationId);

    let extractedText: string;
    if (fileName.toLowerCase().endsWith('.pdf')) {
      extractedText = await this.contentExtractor.extractFromPdf(buffer);
    } else {
      extractedText = this.contentExtractor.extractFromText(buffer.toString('utf-8'));
    }

    const entries = await this.generateKBEntries(extractedText, kb.customApiKey);

    const items = await Promise.all(
      entries.map(entry =>
        this.prisma.knowledgeItem.create({
          data: {
            knowledgeBaseId: kb.id,
            title: entry.title,
            content: entry.content,
            category: entry.category,
            priority: entry.priority,
            keywords: entry.keywords,
            sourceType: 'DOCUMENT',
            sourceFileName: fileName,
          },
        }),
      ),
    );

    return { items, count: items.length };
  }

  /**
   * Generate KB items from wizard Q&A
   */
  async generateFromWizard(organizationId: string, dto: GenerateFromWizardDto) {
    const kb = await this.getOrCreateKB(organizationId);
    const formattedText = this.contentExtractor.formatWizardAnswers(dto as any);
    const entries = await this.generateKBEntries(formattedText, kb.customApiKey);

    const items = await Promise.all(
      entries.map(entry =>
        this.prisma.knowledgeItem.create({
          data: {
            knowledgeBaseId: kb.id,
            title: entry.title,
            content: entry.content,
            category: entry.category,
            priority: entry.priority,
            keywords: entry.keywords,
            sourceType: 'WIZARD',
          },
        }),
      ),
    );

    return { items, count: items.length };
  }

  /**
   * List KB items with pagination and filters
   */
  async listItems(
    organizationId: string,
    params?: { page?: number; limit?: number; category?: string; search?: string },
  ) {
    const kb = await this.getOrCreateKB(organizationId);
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { knowledgeBaseId: kb.id, isActive: true };
    if (params?.category) where.category = params.category;
    if (params?.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { content: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.knowledgeItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { priority: 'desc' },
      }),
      this.prisma.knowledgeItem.count({ where }),
    ]);

    return {
      data: items,
      meta: { page, limit, total, lastPage: Math.ceil(total / limit) },
    };
  }

  /**
   * Update a KB item
   */
  async updateItem(organizationId: string, itemId: string, dto: Partial<CreateKnowledgeItemDto>) {
    const kb = await this.getOrCreateKB(organizationId);
    const item = await this.prisma.knowledgeItem.findFirst({
      where: { id: itemId, knowledgeBaseId: kb.id },
    });

    if (!item) throw new NotFoundException('Item no encontrado');

    return this.prisma.knowledgeItem.update({
      where: { id: itemId },
      data: {
        title: dto.title,
        content: dto.content,
        category: dto.category,
        priority: dto.priority,
        keywords: dto.keywords,
      },
    });
  }

  /**
   * Delete a KB item (soft delete)
   */
  async deleteItem(organizationId: string, itemId: string) {
    const kb = await this.getOrCreateKB(organizationId);
    const item = await this.prisma.knowledgeItem.findFirst({
      where: { id: itemId, knowledgeBaseId: kb.id },
    });

    if (!item) throw new NotFoundException('Item no encontrado');

    return this.prisma.knowledgeItem.update({
      where: { id: itemId },
      data: { isActive: false },
    });
  }

  /**
   * Search relevant KB items for a query (used by AI auto-response)
   */
  async searchRelevantItems(query: string, organizationId: string, limit = 5) {
    const kb = await this.prisma.knowledgeBase.findUnique({
      where: { organizationId },
    });

    if (!kb || !kb.isActive) return [];

    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    // Search by keyword match and content relevance
    const items = await this.prisma.knowledgeItem.findMany({
      where: {
        knowledgeBaseId: kb.id,
        isActive: true,
        OR: [
          { content: { contains: query, mode: 'insensitive' } },
          ...queryWords.map(word => ({
            content: { contains: word, mode: 'insensitive' as const },
          })),
          ...queryWords.map(word => ({
            keywords: { has: word },
          })),
        ],
      },
      orderBy: { priority: 'desc' },
      take: limit,
    });

    return items;
  }

  /**
   * Build KB context string for AI prompt injection
   */
  async buildKBContext(query: string, organizationId: string): Promise<{
    context: string;
    systemPrompt: string | null;
    personality: string;
    confidenceThreshold: number;
  } | null> {
    const kb = await this.prisma.knowledgeBase.findUnique({
      where: { organizationId },
    });

    if (!kb || !kb.isActive) return null;

    const items = await this.searchRelevantItems(query, organizationId);

    if (items.length === 0) {
      return {
        context: '',
        systemPrompt: kb.systemPrompt,
        personality: kb.personality,
        confidenceThreshold: kb.confidenceThreshold,
      };
    }

    const context = items
      .map((item, i) => `[${i + 1}] ${item.title}: ${item.content}`)
      .join('\n\n');

    return {
      context,
      systemPrompt: kb.systemPrompt,
      personality: kb.personality,
      confidenceThreshold: kb.confidenceThreshold,
    };
  }

  /**
   * Use GPT to generate structured KB entries from raw text
   */
  private async generateKBEntries(text: string, customApiKey?: string | null): Promise<GeneratedKBEntry[]> {
    const client = this.getOpenAI(customApiKey || undefined);

    if (!client) {
      this.logger.warn('No OpenAI API key available, generating fallback KB entry');
      return [{
        title: 'Contenido importado',
        content: text.slice(0, 2000),
        category: 'General',
        keywords: [],
        priority: 5,
      }];
    }

    try {
      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Eres un experto en crear bases de conocimiento para asistentes virtuales de atencion al cliente.
A partir del texto proporcionado, genera entre 5 y 15 entradas de conocimiento estructuradas.

Cada entrada debe ser autocontenida (no referenciar otras entradas).

Responde en formato JSON:
{
  "entries": [
    {
      "title": "Titulo descriptivo corto",
      "content": "Contenido completo y util (minimo 50 caracteres)",
      "category": "una de: FAQ, Producto, Precio, Politica, Horario, Contacto, Servicio, General",
      "keywords": ["palabra1", "palabra2", "palabra3"],
      "priority": 1-10
    }
  ]
}

Reglas:
- No inventes informacion que no este en el texto
- Cada entrada debe tener al menos 50 caracteres de contenido
- Prioridad alta (8-10) para precios, horarios y contacto
- Prioridad media (5-7) para servicios y productos
- Prioridad baja (1-4) para informacion general`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0].message.content || '{"entries": []}');
      const entries: GeneratedKBEntry[] = (result.entries || []).slice(0, 15);

      this.logger.log(`Generated ${entries.length} KB entries from content`);
      return entries;
    } catch (error) {
      this.logger.error('Error generating KB entries with OpenAI:', error.message);
      return [{
        title: 'Contenido importado',
        content: text.slice(0, 2000),
        category: 'General',
        keywords: [],
        priority: 5,
      }];
    }
  }
}

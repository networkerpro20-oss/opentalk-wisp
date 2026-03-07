import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ContentExtractorService {
  private readonly logger = new Logger(ContentExtractorService.name);

  /**
   * Extract text content from a URL using cheerio
   */
  async extractFromUrl(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        timeout: 15000,
        maxContentLength: 5 * 1024 * 1024, // 5MB max
        headers: {
          'User-Agent': 'OpenTalkWisp-Bot/1.0',
          Accept: 'text/html,application/xhtml+xml',
        },
      });

      const cheerio = await import('cheerio');
      const $ = cheerio.load(response.data);

      // Remove non-content elements
      $('script, style, nav, footer, header, aside, form, iframe, noscript').remove();

      // Extract text from body
      const text = $('body').text();

      // Clean whitespace
      const cleaned = text
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();

      if (cleaned.length < 50) {
        throw new Error('Contenido extraido insuficiente (menos de 50 caracteres)');
      }

      // Truncate to ~5000 words
      const words = cleaned.split(/\s+/);
      return words.slice(0, 5000).join(' ');
    } catch (error) {
      this.logger.error(`Error extracting from URL ${url}:`, error.message);
      throw new Error(`No se pudo extraer contenido de la URL: ${error.message}`);
    }
  }

  /**
   * Extract text from a PDF buffer
   */
  async extractFromPdf(buffer: Buffer): Promise<string> {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);

      if (!data.text || data.text.length < 50) {
        throw new Error('PDF sin contenido de texto suficiente');
      }

      const words = data.text.split(/\s+/);
      return words.slice(0, 5000).join(' ');
    } catch (error) {
      this.logger.error('Error extracting from PDF:', error.message);
      throw new Error(`No se pudo extraer texto del PDF: ${error.message}`);
    }
  }

  /**
   * Extract text from a plain text or CSV file
   */
  extractFromText(content: string): string {
    const cleaned = content.trim();

    if (cleaned.length < 50) {
      throw new Error('Contenido de texto insuficiente (menos de 50 caracteres)');
    }

    const words = cleaned.split(/\s+/);
    return words.slice(0, 5000).join(' ');
  }

  /**
   * Format wizard Q&A answers into a structured text for KB generation
   */
  formatWizardAnswers(answers: Record<string, string>): string {
    const sections = [
      { key: 'businessName', label: 'Nombre del negocio' },
      { key: 'mainActivity', label: 'Actividad principal' },
      { key: 'servicesAndPricing', label: 'Servicios y precios' },
      { key: 'operatingHours', label: 'Horarios de operacion' },
      { key: 'location', label: 'Ubicacion y cobertura' },
      { key: 'frequentQuestions', label: 'Preguntas frecuentes' },
      { key: 'differentiators', label: 'Diferenciadores competitivos' },
      { key: 'policies', label: 'Politicas (devolucion, garantia, etc.)' },
      { key: 'experience', label: 'Experiencia y trayectoria' },
      { key: 'contactMethods', label: 'Metodos de contacto' },
    ];

    return sections
      .filter(s => answers[s.key])
      .map(s => `${s.label}: ${answers[s.key]}`)
      .join('\n\n');
  }
}

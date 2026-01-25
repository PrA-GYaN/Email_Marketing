import { Injectable, BadRequestException } from '@nestjs/common';

export interface PDFContentSection {
  type: 'heading' | 'paragraph' | 'list-item';
  content: string;
  level?: number;
}

export interface PDFExtractionResult {
  text: string;
  html: string;
  sections: PDFContentSection[];
  metadata: {
    pages: number;
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
  };
}

export interface PDFImagePage {
  pageNumber: number;
  imageData: string; // Base64 data URL
  width: number;
  height: number;
}

export interface PDFDirectResult {
  pages: PDFImagePage[];
  metadata: {
    pages: number;
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
  };
}

@Injectable()
export class PDFExtractorService {
  /**
   * Convert PDF pages to images for direct embedding in emails
   */
  async convertPDFToImages(buffer: Buffer): Promise<PDFDirectResult> {
    try {
      const { PDFParse } = require('pdf-parse');
      const pdfParser = new PDFParse({
        data: buffer,
        verbosity: 0,
      });
      
      // Get basic info
      const info = await pdfParser.getInfo();
      const metadata = {
        pages: info.total,
        title: undefined,
        author: undefined,
        subject: undefined,
        creator: undefined,
      };

      // Convert each page to image
      const screenshots = await pdfParser.getScreenshot({
        scale: 2, // Higher quality
        imageDataUrl: true,
        imageBuffer: false,
      });

      const pages: PDFImagePage[] = screenshots.pages.map((page: any) => ({
        pageNumber: page.pageNumber,
        imageData: page.dataUrl,
        width: page.width,
        height: page.height,
      }));

      return {
        pages,
        metadata,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to convert PDF to images: ${error.message}`
      );
    }
  }

  /**
   * Extract text and metadata from PDF buffer
   */
  async extractPDF(buffer: Buffer): Promise<PDFExtractionResult> {
    try {
      // Import pdf-parse and use PDFParse class
      const { PDFParse } = require('pdf-parse');
      const pdfParser = new PDFParse({
        data: buffer,
        verbosity: 0, // Suppress verbose logging
      });
      const data = await pdfParser.getText();
      
      // Extract metadata from the parsed data
      const metadata = {
        pages: data.total,
        title: undefined,
        author: undefined,
        subject: undefined,
        creator: undefined,
      };

      // Parse text into structured sections
      const sections = this.parseTextIntoSections(data.text);
      
      // Convert to HTML
      const html = this.convertSectionsToHTML(sections, metadata);

      return {
        text: data.text,
        html,
        sections,
        metadata,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to extract PDF content: ${error.message}`
      );
    }
  }

  /**
   * Parse plain text into structured sections
   * Tries to identify headings, paragraphs, and lists
   */
  private parseTextIntoSections(text: string): PDFContentSection[] {
    const sections: PDFContentSection[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip very short lines (likely page numbers or artifacts)
      if (line.length < 3) continue;

      // Detect headings (all caps, short lines, or lines ending with specific patterns)
      if (this.isLikelyHeading(line, lines[i + 1])) {
        sections.push({
          type: 'heading',
          content: line,
          level: this.detectHeadingLevel(line),
        });
      }
      // Detect list items (start with bullet points, numbers, or dashes)
      else if (this.isListItem(line)) {
        sections.push({
          type: 'list-item',
          content: this.cleanListItem(line),
        });
      }
      // Regular paragraph
      else {
        sections.push({
          type: 'paragraph',
          content: line,
        });
      }
    }

    return sections;
  }

  /**
   * Detect if a line is likely a heading
   */
  private isLikelyHeading(line: string, nextLine?: string): boolean {
    // All caps and relatively short (< 80 chars)
    if (line === line.toUpperCase() && line.length < 80) {
      return true;
    }

    // Ends with colon and short
    if (line.endsWith(':') && line.length < 60) {
      return true;
    }

    // Title case and short, followed by longer content
    if (
      this.isTitleCase(line) &&
      line.length < 80 &&
      nextLine &&
      nextLine.length > line.length
    ) {
      return true;
    }

    return false;
  }

  /**
   * Detect heading level based on content
   */
  private detectHeadingLevel(line: string): number {
    if (line === line.toUpperCase() && line.length < 40) {
      return 1; // Main heading
    }
    if (line === line.toUpperCase()) {
      return 2; // Sub-heading
    }
    if (line.endsWith(':')) {
      return 3; // Section heading
    }
    return 2; // Default
  }

  /**
   * Check if text is in Title Case
   */
  private isTitleCase(text: string): boolean {
    const words = text.split(' ');
    if (words.length < 2) return false;
    
    let titleCaseWords = 0;
    for (const word of words) {
      if (word.length > 0 && word[0] === word[0].toUpperCase()) {
        titleCaseWords++;
      }
    }
    
    return titleCaseWords / words.length > 0.6;
  }

  /**
   * Detect if a line is a list item
   */
  private isListItem(line: string): boolean {
    // Starts with bullet points
    if (/^[•●○■□▪▫–—-]\s/.test(line)) {
      return true;
    }

    // Starts with numbers (1., 1), a., a), etc.)
    if (/^(\d+|[a-z])[.)]\s/.test(line)) {
      return true;
    }

    // Starts with asterisk or hyphen
    if (/^[\*-]\s/.test(line)) {
      return true;
    }

    return false;
  }

  /**
   * Clean list item by removing bullet/number prefix
   */
  private cleanListItem(line: string): string {
    return line.replace(/^[•●○■□▪▫–—\*-]\s+/, '')
               .replace(/^(\d+|[a-z])[.)]\s+/, '');
  }

  /**
   * Convert sections to HTML
   */
  private convertSectionsToHTML(
    sections: PDFContentSection[],
    metadata: any
  ): string {
    let html = '<div class="pdf-content" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">\n';

    // Add title if available
    if (metadata.title) {
      html += `  <h1 style="color: #2c3e50; margin-bottom: 10px; font-size: 28px; font-weight: 700;">${this.escapeHtml(metadata.title)}</h1>\n`;
    }

    // Add author if available
    if (metadata.author) {
      html += `  <p style="color: #7f8c8d; font-style: italic; margin-bottom: 20px; font-size: 14px;">By ${this.escapeHtml(metadata.author)}</p>\n`;
    }

    let inList = false;
    let listItems: string[] = [];

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const nextSection = sections[i + 1];

      if (section.type === 'heading') {
        // Close any open list
        if (inList) {
          html += this.renderList(listItems);
          listItems = [];
          inList = false;
        }

        const level = section.level || 2;
        const fontSize = level === 1 ? '24px' : level === 2 ? '20px' : '18px';
        const marginTop = level === 1 ? '30px' : '20px';
        
        html += `  <h${level} style="color: #2c3e50; margin-top: ${marginTop}; margin-bottom: 12px; font-size: ${fontSize}; font-weight: 600;">${this.escapeHtml(section.content)}</h${level}>\n`;
      } 
      else if (section.type === 'list-item') {
        if (!inList) {
          inList = true;
        }
        listItems.push(section.content);

        // If next section is not a list item, close the list
        if (!nextSection || nextSection.type !== 'list-item') {
          html += this.renderList(listItems);
          listItems = [];
          inList = false;
        }
      } 
      else if (section.type === 'paragraph') {
        // Close any open list
        if (inList) {
          html += this.renderList(listItems);
          listItems = [];
          inList = false;
        }

        html += `  <p style="margin-bottom: 15px; font-size: 14px; line-height: 1.8;">${this.escapeHtml(section.content)}</p>\n`;
      }
    }

    // Close any remaining list
    if (inList) {
      html += this.renderList(listItems);
    }

    html += '</div>';
    return html;
  }

  /**
   * Render a list of items as HTML
   */
  private renderList(items: string[]): string {
    let html = '  <ul style="margin-bottom: 20px; padding-left: 25px;">\n';
    for (const item of items) {
      html += `    <li style="margin-bottom: 8px; font-size: 14px; line-height: 1.6;">${this.escapeHtml(item)}</li>\n`;
    }
    html += '  </ul>\n';
    return html;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

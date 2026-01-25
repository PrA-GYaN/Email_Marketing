import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { PDFExtractorService } from './pdf-extractor.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MediaController],
  providers: [MediaService, PDFExtractorService],
  exports: [MediaService, PDFExtractorService],
})
export class MediaModule {}

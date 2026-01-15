import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MediaService } from './media.service';
import { CreateFolderDto, UpdateFolderDto, UpdateMediaDto, MoveMediaDto } from './dto/media.dto';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // Folder endpoints
  @Post('folders')
  async createFolder(@Request() req, @Body() dto: CreateFolderDto) {
    return this.mediaService.createFolder(req.user.userId, dto);
  }

  @Get('folders')
  async getFolders(@Request() req, @Query('parentId') parentId?: string) {
    return this.mediaService.getFolders(req.user.userId, parentId);
  }

  @Get('folders/:id')
  async getFolder(@Request() req, @Param('id') id: string) {
    return this.mediaService.getFolder(req.user.userId, id);
  }

  @Put('folders/:id')
  async updateFolder(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateFolderDto,
  ) {
    return this.mediaService.updateFolder(req.user.userId, id, dto);
  }

  @Delete('folders/:id')
  async deleteFolder(@Request() req, @Param('id') id: string) {
    return this.mediaService.deleteFolder(req.user.userId, id);
  }

  // File endpoints
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body('folderId') folderId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 50MB limit');
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('File type not allowed');
    }

    return this.mediaService.uploadFile(req.user.userId, file, folderId);
  }

  @Get('files')
  async getFiles(@Request() req, @Query('folderId') folderId?: string) {
    return this.mediaService.getFiles(req.user.userId, folderId);
  }

  @Get('files/search')
  async searchFiles(@Request() req, @Query('q') query: string) {
    if (!query) {
      throw new BadRequestException('Search query is required');
    }
    return this.mediaService.searchFiles(req.user.userId, query);
  }

  @Get('files/:id')
  async getFile(@Request() req, @Param('id') id: string) {
    return this.mediaService.getFile(req.user.userId, id);
  }

  @Put('files/:id')
  async updateFile(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateMediaDto,
  ) {
    return this.mediaService.updateFile(req.user.userId, id, dto);
  }

  @Put('files/:id/move')
  async moveFile(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: MoveMediaDto,
  ) {
    return this.mediaService.moveFile(req.user.userId, id, dto);
  }

  @Delete('files/:id')
  async deleteFile(@Request() req, @Param('id') id: string) {
    return this.mediaService.deleteFile(req.user.userId, id);
  }

  @Get('storage/usage')
  async getStorageUsage(@Request() req) {
    return this.mediaService.getStorageUsage(req.user.userId);
  }
}

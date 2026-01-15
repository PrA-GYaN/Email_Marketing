import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto, UpdateFolderDto, UpdateMediaDto, MoveMediaDto } from './dto/media.dto';
import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';

@Injectable()
export class MediaService {
  private readonly uploadDir: string;

  constructor(private prisma: PrismaService) {
    // Use environment variable or default to uploads folder
    this.uploadDir = process.env.MEDIA_UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    if (!existsSync(this.uploadDir)) {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  // Folder Management
  async createFolder(userId: string, dto: CreateFolderDto) {
    // Verify parent folder exists and belongs to user
    if (dto.parentId) {
      const parentFolder = await this.prisma.mediaFolder.findFirst({
        where: { id: dto.parentId, userId },
      });
      if (!parentFolder) {
        throw new BadRequestException('Parent folder not found');
      }
    }

    // Check for duplicate folder name in same location
    const existing = await this.prisma.mediaFolder.findFirst({
      where: {
        name: dto.name,
        userId,
        parentId: dto.parentId || null,
      },
    });

    if (existing) {
      throw new BadRequestException('A folder with this name already exists in this location');
    }

    return this.prisma.mediaFolder.create({
      data: {
        name: dto.name,
        parentId: dto.parentId,
        userId,
      },
    });
  }

  async getFolders(userId: string, parentId?: string) {
    return this.prisma.mediaFolder.findMany({
      where: {
        userId,
        parentId: parentId || null,
      },
      include: {
        _count: {
          select: {
            children: true,
            files: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getFolder(userId: string, id: string) {
    const folder = await this.prisma.mediaFolder.findFirst({
      where: { id, userId },
      include: {
        parent: true,
        _count: {
          select: {
            children: true,
            files: true,
          },
        },
      },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    return folder;
  }

  async updateFolder(userId: string, id: string, dto: UpdateFolderDto) {
    const folder = await this.getFolder(userId, id);

    // Check for duplicate name
    const existing = await this.prisma.mediaFolder.findFirst({
      where: {
        name: dto.name,
        userId,
        parentId: folder.parentId,
        id: { not: id },
      },
    });

    if (existing) {
      throw new BadRequestException('A folder with this name already exists in this location');
    }

    return this.prisma.mediaFolder.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async deleteFolder(userId: string, id: string) {
    const folder = await this.getFolder(userId, id);

    // Check if folder has children or files
    const hasChildren = await this.prisma.mediaFolder.count({
      where: { parentId: id },
    });

    const hasFiles = await this.prisma.mediaFile.count({
      where: { folderId: id },
    });

    if (hasChildren > 0 || hasFiles > 0) {
      throw new BadRequestException('Cannot delete folder with contents. Please delete or move contents first.');
    }

    return this.prisma.mediaFolder.delete({
      where: { id },
    });
  }

  // File Management
  async uploadFile(
    userId: string,
    file: Express.Multer.File,
    folderId?: string,
  ) {
    // Verify folder exists if provided
    if (folderId) {
      const folder = await this.prisma.mediaFolder.findFirst({
        where: { id: folderId, userId },
      });
      if (!folder) {
        throw new BadRequestException('Folder not found');
      }
    }

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    // Save file to disk
    await fs.writeFile(filePath, file.buffer);

    // Create database record
    const mediaFile = await this.prisma.mediaFile.create({
      data: {
        name: file.originalname,
        filename,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/${filename}`,
        folderId: folderId || null,
        userId,
      },
    });

    return mediaFile;
  }

  async getFiles(userId: string, folderId?: string) {
    return this.prisma.mediaFile.findMany({
      where: {
        userId,
        folderId: folderId || null,
      },
      include: {
        folder: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFile(userId: string, id: string) {
    const file = await this.prisma.mediaFile.findFirst({
      where: { id, userId },
      include: {
        folder: true,
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  async updateFile(userId: string, id: string, dto: UpdateMediaDto) {
    const file = await this.getFile(userId, id);

    // Verify new folder exists if provided
    if (dto.folderId) {
      const folder = await this.prisma.mediaFolder.findFirst({
        where: { id: dto.folderId, userId },
      });
      if (!folder) {
        throw new BadRequestException('Folder not found');
      }
    }

    return this.prisma.mediaFile.update({
      where: { id },
      data: {
        name: dto.name,
        folderId: dto.folderId === null ? null : dto.folderId,
      },
    });
  }

  async moveFile(userId: string, id: string, dto: MoveMediaDto) {
    const file = await this.getFile(userId, id);

    // Verify folder exists if provided
    if (dto.folderId) {
      const folder = await this.prisma.mediaFolder.findFirst({
        where: { id: dto.folderId, userId },
      });
      if (!folder) {
        throw new BadRequestException('Folder not found');
      }
    }

    return this.prisma.mediaFile.update({
      where: { id },
      data: {
        folderId: dto.folderId || null,
      },
    });
  }

  async deleteFile(userId: string, id: string) {
    const file = await this.getFile(userId, id);

    // Delete physical file
    const filePath = path.join(this.uploadDir, file.filename);
    try {
      if (existsSync(filePath)) {
        await fs.unlink(filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete database record
    return this.prisma.mediaFile.delete({
      where: { id },
    });
  }

  async searchFiles(userId: string, query: string) {
    return this.prisma.mediaFile.findMany({
      where: {
        userId,
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        folder: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getStorageUsage(userId: string) {
    const result = await this.prisma.mediaFile.aggregate({
      where: { userId },
      _sum: {
        size: true,
      },
      _count: true,
    });

    return {
      totalFiles: result._count,
      totalSize: result._sum.size || 0,
      totalSizeMB: ((result._sum.size || 0) / (1024 * 1024)).toFixed(2),
    };
  }
}

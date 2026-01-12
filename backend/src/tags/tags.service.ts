import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateTagDto) {
    // Check if tag name already exists for this user
    const existing = await this.prisma.tag.findUnique({
      where: {
        name_userId: {
          name: dto.name,
          userId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Tag with this name already exists');
    }

    return this.prisma.tag.create({
      data: {
        name: dto.name,
        userId,
      },
      include: {
        _count: {
          select: { contacts: true },
        },
      },
    });
  }

  async findAll(userId: string) {
    const tags = await this.prisma.tag.findMany({
      where: { userId },
      include: {
        _count: {
          select: { contacts: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return tags.map((tag) => ({
      ...tag,
      contactCount: tag._count.contacts,
    }));
  }

  async findOne(userId: string, id: string) {
    const tag = await this.prisma.tag.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { contacts: true },
        },
        contacts: {
          include: {
            contact: true,
          },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return {
      ...tag,
      contactCount: tag._count.contacts,
    };
  }

  async update(userId: string, id: string, dto: UpdateTagDto) {
    await this.findOne(userId, id);

    // Check if new name conflicts
    const existing = await this.prisma.tag.findFirst({
      where: {
        name: dto.name,
        userId,
        id: { not: id },
      },
    });

    if (existing) {
      throw new ConflictException('Tag with this name already exists');
    }

    return this.prisma.tag.update({
      where: { id },
      data: { name: dto.name },
      include: {
        _count: {
          select: { contacts: true },
        },
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    // Delete tag (cascade will remove contact relationships)
    await this.prisma.tag.delete({
      where: { id },
    });

    return { message: 'Tag deleted successfully' };
  }

  async getContactsByTags(userId: string, tagIds: string[]) {
    // Verify all tags belong to user
    const tags = await this.prisma.tag.findMany({
      where: {
        id: { in: tagIds },
        userId,
      },
    });

    if (tags.length !== tagIds.length) {
      throw new NotFoundException('Some tags not found');
    }

    // Get contacts with OR logic (any of the tags)
    const contacts = await this.prisma.contact.findMany({
      where: {
        userId,
        status: 'SUBSCRIBED',
        tags: {
          some: {
            tagId: { in: tagIds },
          },
        },
      },
      distinct: ['email'], // Remove duplicates
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return contacts;
  }

  async getStats(userId: string) {
    const total = await this.prisma.tag.count({
      where: { userId },
    });

    const tagsWithCounts = await this.prisma.tag.findMany({
      where: { userId },
      include: {
        _count: {
          select: { contacts: true },
        },
      },
      orderBy: {
        contacts: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    return {
      total,
      topTags: tagsWithCounts.map((tag) => ({
        id: tag.id,
        name: tag.name,
        contactCount: tag._count.contacts,
      })),
    };
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto, UpdateContactDto } from './dto/contact.dto';
import { ContactStatus } from '@prisma/client';
import * as csvParser from 'csv-parser';
import { Readable } from 'stream';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateContactDto) {
    // Check if contact already exists
    const existing = await this.prisma.contact.findUnique({
      where: {
        email_userId: {
          email: dto.email,
          userId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Contact with this email already exists');
    }

    // Create contact
    const contact = await this.prisma.contact.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        status: dto.status || ContactStatus.SUBSCRIBED,
        userId,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Assign tags if provided
    if (dto.tagIds && dto.tagIds.length > 0) {
      await this.assignTags(userId, contact.id, dto.tagIds);
    }

    return this.findOne(userId, contact.id);
  }

  async findAll(userId: string, query?: { status?: ContactStatus; tagId?: string; search?: string }) {
    const where: any = { userId };

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.tagId) {
      where.tags = {
        some: {
          tagId: query.tagId,
        },
      };
    }

    if (query?.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.contact.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, userId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  async update(userId: string, id: string, dto: UpdateContactDto) {
    await this.findOne(userId, id);

    return this.prisma.contact.update({
      where: { id },
      data: dto,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.contact.delete({
      where: { id },
    });

    return { message: 'Contact deleted successfully' };
  }

  async bulkDelete(userId: string, contactIds: string[]) {
    const deleted = await this.prisma.contact.deleteMany({
      where: {
        id: { in: contactIds },
        userId,
      },
    });

    return { message: `${deleted.count} contacts deleted successfully` };
  }

  async importFromCsv(userId: string, fileBuffer: Buffer, tagIds?: string[]) {
    const results: any[] = [];
    const errors: any[] = [];

    // Parse CSV
    const readable = Readable.from(fileBuffer.toString());
    
    await new Promise((resolve, reject) => {
      readable
        .pipe(csvParser())
        .on('data', (row) => {
          results.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (results.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    // Validate and import contacts
    const imported: any[] = [];
    
    for (const row of results) {
      try {
        // Validate required fields
        if (!row.email) {
          errors.push({ row, error: 'Email is required' });
          continue;
        }

        // Check if already exists
        const existing = await this.prisma.contact.findUnique({
          where: {
            email_userId: {
              email: row.email,
              userId,
            },
          },
        });

        if (existing) {
          errors.push({ row, error: 'Email already exists' });
          continue;
        }

        // Create contact
        const contact = await this.prisma.contact.create({
          data: {
            email: row.email,
            firstName: row.firstName || row.first_name || null,
            lastName: row.lastName || row.last_name || null,
            status: ContactStatus.SUBSCRIBED,
            userId,
          },
        });

        // Assign tags
        if (tagIds && tagIds.length > 0) {
          await this.assignTags(userId, contact.id, tagIds);
        }

        imported.push(contact);
      } catch (error) {
        errors.push({ row, error: error.message });
      }
    }

    return {
      imported: imported.length,
      failed: errors.length,
      errors: errors.slice(0, 10), // Return first 10 errors
    };
  }

  async assignTags(userId: string, contactId: string, tagIds: string[]) {
    // Verify contact belongs to user
    await this.findOne(userId, contactId);

    // Verify tags belong to user
    const tags = await this.prisma.tag.findMany({
      where: {
        id: { in: tagIds },
        userId,
      },
    });

    if (tags.length !== tagIds.length) {
      throw new BadRequestException('Some tags not found');
    }

    // Remove existing tags and add new ones
    await this.prisma.contactTag.deleteMany({
      where: { contactId },
    });

    await this.prisma.contactTag.createMany({
      data: tagIds.map((tagId) => ({
        contactId,
        tagId,
      })),
      skipDuplicates: true,
    });

    return this.findOne(userId, contactId);
  }

  async bulkAssignTags(userId: string, contactIds: string[], tagIds: string[]) {
    // Verify tags belong to user
    const tags = await this.prisma.tag.findMany({
      where: {
        id: { in: tagIds },
        userId,
      },
    });

    if (tags.length !== tagIds.length) {
      throw new BadRequestException('Some tags not found');
    }

    // Create contact-tag relationships
    const data = contactIds.flatMap((contactId) =>
      tagIds.map((tagId) => ({
        contactId,
        tagId,
      })),
    );

    await this.prisma.contactTag.createMany({
      data,
      skipDuplicates: true,
    });

    return { message: 'Tags assigned successfully' };
  }

  async bulkRemoveTags(userId: string, contactIds: string[], tagIds: string[]) {
    await this.prisma.contactTag.deleteMany({
      where: {
        contactId: { in: contactIds },
        tagId: { in: tagIds },
      },
    });

    return { message: 'Tags removed successfully' };
  }

  async getStats(userId: string) {
    const total = await this.prisma.contact.count({
      where: { userId },
    });

    const subscribed = await this.prisma.contact.count({
      where: { userId, status: ContactStatus.SUBSCRIBED },
    });

    const unsubscribed = await this.prisma.contact.count({
      where: { userId, status: ContactStatus.UNSUBSCRIBED },
    });

    return {
      total,
      subscribed,
      unsubscribed,
    };
  }
}

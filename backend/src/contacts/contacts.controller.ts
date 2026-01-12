import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContactsService } from './contacts.service';
import { CreateContactDto, UpdateContactDto, AssignTagsDto, RemoveTagsDto, QueryContactsDto } from './dto/contact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateContactDto) {
    return this.contactsService.create(req.user.userId, dto);
  }

  @Get()
  findAll(
    @Request() req,
    @Query() query: QueryContactsDto,
  ) {
    return this.contactsService.findAll(req.user.userId, query);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.contactsService.getStats(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.contactsService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateContactDto) {
    return this.contactsService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.contactsService.remove(req.user.userId, id);
  }

  @Post('bulk-delete')
  bulkDelete(@Request() req, @Body() body: { contactIds: string[] }) {
    return this.contactsService.bulkDelete(req.user.userId, body.contactIds);
  }

  @Post('import-csv')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body('tagIds') tagIds?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const tagIdArray = tagIds ? JSON.parse(tagIds) : [];
    return this.contactsService.importFromCsv(req.user.userId, file.buffer, tagIdArray);
  }

  @Post(':id/tags')
  assignTags(@Request() req, @Param('id') id: string, @Body() body: { tagIds: string[] }) {
    return this.contactsService.assignTags(req.user.userId, id, body.tagIds);
  }

  @Post('bulk-assign-tags')
  bulkAssignTags(@Request() req, @Body() dto: AssignTagsDto) {
    return this.contactsService.bulkAssignTags(req.user.userId, dto.contactIds, dto.tagIds);
  }

  @Post('bulk-remove-tags')
  bulkRemoveTags(@Request() req, @Body() dto: RemoveTagsDto) {
    return this.contactsService.bulkRemoveTags(req.user.userId, dto.contactIds, dto.tagIds);
  }
}

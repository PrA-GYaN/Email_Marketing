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
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateTagDto) {
    return this.tagsService.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Request() req) {
    return this.tagsService.findAll(req.user.userId);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.tagsService.getStats(req.user.userId);
  }

  @Get('contacts-by-tags')
  getContactsByTags(@Request() req, @Query('tagIds') tagIds: string) {
    const tagIdArray = tagIds.split(',');
    return this.tagsService.getContactsByTags(req.user.userId, tagIdArray);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.tagsService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateTagDto) {
    return this.tagsService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.tagsService.remove(req.user.userId, id);
  }
}

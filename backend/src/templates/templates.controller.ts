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
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  create(@Request() req, @Body() createTemplateDto: CreateTemplateDto) {
    return this.templatesService.create(req.user.userId, createTemplateDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.templatesService.findAll(req.user.userId);
  }

  @Get('built-in')
  getDefaultTemplates() {
    return this.templatesService.getDefaultTemplates();
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.templatesService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    return this.templatesService.update(req.user.userId, id, updateTemplateDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.templatesService.remove(req.user.userId, id);
  }

  @Post(':id/duplicate')
  duplicate(@Request() req, @Param('id') id: string) {
    return this.templatesService.duplicate(req.user.userId, id);
  }

  @Post(':id/set-default')
  setDefault(@Request() req, @Param('id') id: string) {
    return this.templatesService.setDefault(req.user.userId, id);
  }
}

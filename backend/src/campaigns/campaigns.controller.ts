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
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, UpdateCampaignDto, SendTestEmailDto, QueryCampaignsDto } from './dto/campaign.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('campaigns')
@UseGuards(JwtAuthGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Request() req, @Query() query: QueryCampaignsDto) {
    return this.campaignsService.findAll(req.user.userId, query);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.campaignsService.getStats(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.campaignsService.findOne(req.user.userId, id);
  }

  @Get(':id/analytics')
  getAnalytics(@Request() req, @Param('id') id: string) {
    return this.campaignsService.getAnalytics(req.user.userId, id);
  }

  @Get('merge-tags')
  getMergeTags() {
    return this.campaignsService.getMergeTags();
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaignsService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.campaignsService.remove(req.user.userId, id);
  }

  @Post(':id/send')
  sendNow(@Request() req, @Param('id') id: string) {
    return this.campaignsService.sendNow(req.user.userId, id);
  }

  @Post(':id/send-test')
  sendTest(@Request() req, @Param('id') id: string, @Body() dto: SendTestEmailDto) {
    return this.campaignsService.sendTest(req.user.userId, id, dto.testEmail);
  }
}

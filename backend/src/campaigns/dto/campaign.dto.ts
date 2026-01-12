import {
  IsString,
  IsEmail,
  IsArray,
  IsOptional,
  IsDateString,
  ArrayMinSize,
  IsObject,
  IsEnum,
} from 'class-validator';
import { CampaignStatus } from '@prisma/client';

export class QueryCampaignsDto {
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;
}

export class CreateCampaignDto {
  @IsString()
  name: string;

  @IsString()
  subject: string;

  @IsString()
  senderName: string;

  @IsEmail()
  senderEmail: string;

  @IsObject()
  emailContent: any; // Block-based content

  @IsOptional()
  @IsString()
  templateId?: string; // ID of email template to use

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  tagIds: string[];

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  senderName?: string;

  @IsOptional()
  @IsEmail()
  senderEmail?: string;

  @IsOptional()
  @IsObject()
  emailContent?: any;

  @IsOptional()
  @IsString()
  templateId?: string; // ID of email template to use

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class SendTestEmailDto {
  @IsEmail()
  testEmail: string;
}

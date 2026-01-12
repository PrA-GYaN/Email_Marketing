import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { ContactStatus } from '@prisma/client';

export class QueryContactsDto {
  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;

  @IsOptional()
  @IsString()
  tagId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateContactDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}

export class UpdateContactDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;
}

export class BulkCreateContactDto {
  @IsArray()
  @ArrayMinSize(1)
  contacts: CreateContactDto[];
}

export class AssignTagsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  contactIds: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  tagIds: string[];
}

export class RemoveTagsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  contactIds: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  tagIds: string[];
}

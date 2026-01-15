import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateFolderDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}

export class UpdateFolderDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateMediaDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  folderId?: string;
}

export class MoveMediaDto {
  @IsString()
  @IsOptional()
  folderId?: string; // null or undefined = move to root
}

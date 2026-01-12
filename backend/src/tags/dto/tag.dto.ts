import { IsString, MinLength } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @MinLength(1)
  name: string;
}

export class UpdateTagDto {
  @IsString()
  @MinLength(1)
  name: string;
}

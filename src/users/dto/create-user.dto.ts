import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @Transform(({ value }) => sanitizeHtml(value))
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}

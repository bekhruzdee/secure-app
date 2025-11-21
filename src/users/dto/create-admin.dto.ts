import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MinLength,
  IsIn,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';

export class CreateAdminDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @Transform(({ value }) => sanitizeHtml(value))
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/, {
    message: 'Password must contain at least one special character',
  })
  password: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['admin'])
  role: string;
}


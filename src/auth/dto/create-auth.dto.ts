import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';

export class CreateAuthDto {
  @IsNotEmpty({ message: 'Username bo‘sh bo‘lishi mumkin emas' })
  @IsString({ message: 'Username faqat string bo‘lishi kerak' })
  @MinLength(3, {
    message: 'Username kamida 3 ta belgidan iborat bo‘lishi kerak',
  })
  @MaxLength(30, { message: 'Username 30 belgidan oshmasligi kerak' })
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  username: string;

  @IsNotEmpty({ message: 'Password bo‘sh bo‘lishi mumkin emas' })
  @IsString({ message: 'Password faqat string bo‘lishi kerak' })
  @MinLength(6, {
    message: 'Password kamida 6 ta belgidan iborat bo‘lishi kerak',
  })
  @MaxLength(50, { message: 'Password 50 belgidan oshmasligi kerak' })
  @Matches(/^\S+$/, {
    message: 'Password ichida bo‘sh joy bo‘lishi mumkin emas',
  })
  @Matches(/[^A-Za-z0-9]/, {
    message: 'Password ichida kamida 1 ta belgi (symbol) bo‘lishi shart',
  })
  @Transform(({ value }) => sanitizeHtml(value?.trim()))
  password: string;
}

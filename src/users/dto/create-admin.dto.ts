// import {
//   IsNotEmpty,
//   IsString,
//   IsEmail,
//   MinLength,
//   IsIn,
// } from 'class-validator';

// export class CreateAdminDto {
//   @IsNotEmpty()
//   @IsString()
//   @MinLength(3)
//   username: string;

//   @IsNotEmpty()
//   @IsEmail()
//   email: string;

//   @IsNotEmpty()
//   @IsString()
//   @MinLength(6)
//   password: string;

//   @IsNotEmpty()
//   @IsString()
//   @IsIn(['admin'])
//   role: string;
// }
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MinLength,
  IsIn,
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
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['admin'])
  role: string;
}

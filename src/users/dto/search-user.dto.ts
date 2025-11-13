import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class SearchUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  username: string;
}

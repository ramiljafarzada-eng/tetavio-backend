import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class PasswordResetRequestDto {
  @ApiProperty({ example: 'ramil@example.com' })
  @IsEmail()
  email!: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class EmailVerificationRequestDto {
  @ApiProperty({ example: 'ramil@example.com' })
  @IsEmail()
  email!: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class EmailVerificationConfirmDto {
  @ApiProperty()
  @IsString()
  @MinLength(20)
  token!: string;
}

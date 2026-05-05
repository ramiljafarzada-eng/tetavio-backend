import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'ramil@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional({ example: 'Ramil Jafarzada' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @ApiProperty({ example: '2009752131' })
  @IsString()
  @Matches(/^\d{10}$/, { message: 'VÖEN must be exactly 10 digits' })
  taxId!: string;

  @ApiPropertyOptional({ example: 'FREE_BASIC', enum: ['FREE_BASIC', 'FREE'] })
  @IsOptional()
  @IsIn(['FREE_BASIC', 'FREE'])
  signupPlan?: string;
}

import { SupportThreadStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateSupportThreadStatusDto {
  @ApiProperty({ enum: SupportThreadStatus, example: SupportThreadStatus.CLOSED })
  @IsEnum(SupportThreadStatus)
  status!: SupportThreadStatus;
}

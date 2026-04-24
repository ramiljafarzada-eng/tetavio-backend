import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CheckoutDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  orderId!: string;
}

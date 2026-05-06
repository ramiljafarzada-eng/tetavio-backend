import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto, ReceivePurchaseOrderDto, UpdatePurchaseOrderDto } from './dto/purchase-order.dto';

@ApiTags('Warehouse - Purchase Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('warehouse/purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly svc: PurchaseOrdersService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query('status') status?: string) {
    return this.svc.findAll(user, status);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(user, id);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePurchaseOrderDto) {
    return this.svc.create(user, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePurchaseOrderDto) {
    return this.svc.update(user, id, dto);
  }

  @Post(':id/receive')
  receive(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ReceivePurchaseOrderDto) {
    return this.svc.receive(user, id, dto);
  }
}

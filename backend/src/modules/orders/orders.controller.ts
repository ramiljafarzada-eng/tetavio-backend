import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get orders for current account' })
  getMyOrders(@CurrentUser() user: JwtPayload) {
    return this.ordersService.getMyOrders(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by id for current account' })
  getOrderById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ordersService.getOrderById(user, id);
  }
}

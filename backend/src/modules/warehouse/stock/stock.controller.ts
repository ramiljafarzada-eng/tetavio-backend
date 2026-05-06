import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { StockService } from './stock.service';
import { CreateMovementDto, ListMovementsQueryDto } from './dto/stock.dto';

@ApiTags('Warehouse - Stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('warehouse/stock')
export class StockController {
  constructor(private readonly svc: StockService) {}

  @Get('balances')
  listBalances(@CurrentUser() user: JwtPayload, @Query('warehouseId') warehouseId?: string) {
    return this.svc.listBalances(user, warehouseId);
  }

  @Get('movements')
  listMovements(@CurrentUser() user: JwtPayload, @Query() query: ListMovementsQueryDto) {
    return this.svc.listMovements(user, query);
  }

  @Post('movements')
  createMovement(@CurrentUser() user: JwtPayload, @Body() dto: CreateMovementDto) {
    return this.svc.createMovement(user, dto);
  }
}

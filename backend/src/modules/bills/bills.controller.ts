import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { ListBillsQueryDto } from './dto/list-bills-query.dto';
import { BillsService } from './bills.service';

@ApiTags('Bills')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Get()
  @ApiOperation({ summary: 'List bills for authenticated account' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'vendorId', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'issueDateFrom', required: false, type: String })
  @ApiQuery({ name: 'issueDateTo', required: false, type: String })
  @ApiQuery({ name: 'dueDateFrom', required: false, type: String })
  @ApiQuery({ name: 'dueDateTo', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['issueDate', 'dueDate', 'createdAt', 'billNumber', 'totalMinor', 'status'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  list(@CurrentUser() user: JwtPayload, @Query() query: ListBillsQueryDto) {
    return this.billsService.list(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bill by id for authenticated account' })
  getById(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) billId: string,
  ) {
    return this.billsService.getById(user, billId);
  }

  @Post()
  @ApiOperation({ summary: 'Create bill for authenticated account' })
  @ApiBody({ type: CreateBillDto })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBillDto) {
    return this.billsService.create(user, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update bill for authenticated account' })
  @ApiBody({ type: UpdateBillDto })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) billId: string,
    @Body() dto: UpdateBillDto,
  ) {
    return this.billsService.update(user, billId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete bill for authenticated account' })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) billId: string,
  ) {
    return this.billsService.remove(user, billId);
  }
}

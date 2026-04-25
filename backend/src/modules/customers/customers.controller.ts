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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@ApiTags('Customers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List customers for authenticated account' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'displayName', 'companyName', 'email'],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  list(@CurrentUser() user: JwtPayload, @Query() query: ListCustomersQueryDto) {
    return this.customersService.list(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by id for authenticated account' })
  getById(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) customerId: string,
  ) {
    return this.customersService.getById(user, customerId);
  }

  @Post()
  @ApiOperation({ summary: 'Create customer for authenticated account' })
  @ApiBody({ type: CreateCustomerDto })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(user, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer for authenticated account' })
  @ApiBody({ type: UpdateCustomerDto })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) customerId: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(user, customerId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete customer for authenticated account' })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) customerId: string,
  ) {
    return this.customersService.remove(user, customerId);
  }
}

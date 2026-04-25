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
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoicesService } from './invoices.service';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';

@ApiTags('Invoices')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'List invoices for authenticated account' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'customerId', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'issueDateFrom', required: false, type: String })
  @ApiQuery({ name: 'issueDateTo', required: false, type: String })
  @ApiQuery({ name: 'dueDateFrom', required: false, type: String })
  @ApiQuery({ name: 'dueDateTo', required: false, type: String })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['issueDate', 'dueDate', 'createdAt', 'invoiceNumber', 'totalMinor', 'status'],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  list(@CurrentUser() user: JwtPayload, @Query() query: ListInvoicesQueryDto) {
    return this.invoicesService.list(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by id for authenticated account' })
  getById(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) invoiceId: string,
  ) {
    return this.invoicesService.getById(user, invoiceId);
  }

  @Post()
  @ApiOperation({ summary: 'Create invoice for authenticated account' })
  @ApiBody({ type: CreateInvoiceDto })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(user, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update invoice for authenticated account' })
  @ApiBody({ type: UpdateInvoiceDto })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) invoiceId: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(user, invoiceId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete invoice for authenticated account' })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) invoiceId: string,
  ) {
    return this.invoicesService.remove(user, invoiceId);
  }
}

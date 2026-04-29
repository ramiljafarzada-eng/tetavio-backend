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
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreateInvoicePaymentDto } from './dto/create-invoice-payment.dto';
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

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download invoice as PDF for authenticated account' })
  async downloadPdf(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) invoiceId: string,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, invoiceNumber } = await this.invoicesService.generatePdf(user, invoiceId);
    const filename = `invoice-${invoiceNumber}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
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

  // ─── Payment sub-resource ──────────────────────────────────────────────────

  @Get(':id/payments')
  @ApiOperation({ summary: 'List payments for an invoice' })
  listPayments(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) invoiceId: string,
  ) {
    return this.invoicesService.listPayments(user, invoiceId);
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Add a payment to an invoice' })
  @ApiBody({ type: CreateInvoicePaymentDto })
  addPayment(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) invoiceId: string,
    @Body() dto: CreateInvoicePaymentDto,
  ) {
    return this.invoicesService.addPayment(user, invoiceId, dto);
  }

  @Delete(':id/payments/:paymentId')
  @ApiOperation({ summary: 'Delete a payment from an invoice' })
  removePayment(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) invoiceId: string,
    @Param('paymentId', new ParseUUIDPipe()) paymentId: string,
  ) {
    return this.invoicesService.removePayment(user, invoiceId, paymentId);
  }
}

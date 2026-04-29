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
import { BankingService } from './banking.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { ListBankAccountsQueryDto } from './dto/list-bank-accounts-query.dto';
import { CreateBankTransactionDto } from './dto/create-bank-transaction.dto';
import { ListBankTransactionsQueryDto } from './dto/list-bank-transactions-query.dto';

@ApiTags('Banking')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('banking')
export class BankingController {
  constructor(private readonly bankingService: BankingService) {}

  // ─── bank accounts ────────────────────────────────────────────────────────────

  @Get('accounts')
  @ApiOperation({ summary: 'List bank accounts for authenticated account' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  listAccounts(@CurrentUser() user: JwtPayload, @Query() query: ListBankAccountsQueryDto) {
    return this.bankingService.listAccounts(user, query);
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Create a bank account for authenticated account' })
  @ApiBody({ type: CreateBankAccountDto })
  createAccount(@CurrentUser() user: JwtPayload, @Body() dto: CreateBankAccountDto) {
    return this.bankingService.createAccount(user, dto);
  }

  @Patch('accounts/:id')
  @ApiOperation({ summary: 'Update a bank account for authenticated account' })
  @ApiBody({ type: UpdateBankAccountDto })
  updateAccount(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBankAccountDto,
  ) {
    return this.bankingService.updateAccount(user, id, dto);
  }

  @Delete('accounts/:id')
  @ApiOperation({ summary: 'Delete a bank account (soft delete, blocks if has active transactions)' })
  deleteAccount(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.bankingService.deleteAccount(user, id);
  }

  // ─── bank transactions ────────────────────────────────────────────────────────

  @Get('transactions')
  @ApiOperation({ summary: 'List bank transactions for authenticated account' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'bankAccountId', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'type', required: false, enum: ['INFLOW', 'OUTFLOW'] })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  listTransactions(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListBankTransactionsQueryDto,
  ) {
    return this.bankingService.listTransactions(user, query);
  }

  @Post('transactions')
  @ApiOperation({ summary: 'Create a bank transaction and update account balance' })
  @ApiBody({ type: CreateBankTransactionDto })
  createTransaction(@CurrentUser() user: JwtPayload, @Body() dto: CreateBankTransactionDto) {
    return this.bankingService.createTransaction(user, dto);
  }

  @Delete('transactions/:id')
  @ApiOperation({ summary: 'Delete a bank transaction and reverse balance effect' })
  deleteTransaction(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.bankingService.deleteTransaction(user, id);
  }
}

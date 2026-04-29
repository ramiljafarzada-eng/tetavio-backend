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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccountingService } from './accounting.service';
import { CreateAccountingAccountDto } from './dto/create-accounting-account.dto';
import { UpdateAccountingAccountDto } from './dto/update-accounting-account.dto';
import { ListAccountingAccountsQueryDto } from './dto/list-accounting-accounts-query.dto';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from './dto/update-journal-entry.dto';
import { ListJournalEntriesQueryDto } from './dto/list-journal-entries-query.dto';

@ApiTags('Accounting')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  // ─── chart of accounts ──────────────────────────────────────────────────────

  @Get('accounts')
  @ApiOperation({ summary: 'List chart of accounts for authenticated account' })
  listAccounts(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListAccountingAccountsQueryDto,
  ) {
    return this.accountingService.listAccounts(user, query);
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Create accounting account' })
  @ApiBody({ type: CreateAccountingAccountDto })
  createAccount(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAccountingAccountDto,
  ) {
    return this.accountingService.createAccount(user, dto);
  }

  @Patch('accounts/:id')
  @ApiOperation({ summary: 'Update accounting account' })
  @ApiBody({ type: UpdateAccountingAccountDto })
  updateAccount(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAccountingAccountDto,
  ) {
    return this.accountingService.updateAccount(user, id, dto);
  }

  @Delete('accounts/:id')
  @ApiOperation({ summary: 'Delete accounting account (soft delete)' })
  deleteAccount(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.accountingService.deleteAccount(user, id);
  }

  // ─── journal entries ────────────────────────────────────────────────────────

  @Get('journals')
  @ApiOperation({ summary: 'List journal entries for authenticated account' })
  listJournals(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListJournalEntriesQueryDto,
  ) {
    return this.accountingService.listJournals(user, query);
  }

  @Get('journals/:id')
  @ApiOperation({ summary: 'Get journal entry by id' })
  getJournalById(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.accountingService.getJournalById(user, id);
  }

  @Post('journals')
  @ApiOperation({ summary: 'Create journal entry with double-entry lines' })
  @ApiBody({ type: CreateJournalEntryDto })
  createJournal(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateJournalEntryDto,
  ) {
    return this.accountingService.createJournal(user, dto);
  }

  @Patch('journals/:id')
  @ApiOperation({ summary: 'Update journal entry' })
  @ApiBody({ type: UpdateJournalEntryDto })
  updateJournal(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateJournalEntryDto,
  ) {
    return this.accountingService.updateJournal(user, id, dto);
  }

  @Delete('journals/:id')
  @ApiOperation({ summary: 'Delete journal entry (soft delete)' })
  deleteJournal(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.accountingService.deleteJournal(user, id);
  }
}

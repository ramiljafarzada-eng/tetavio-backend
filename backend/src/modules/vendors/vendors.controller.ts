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
import { CreateVendorDto } from './dto/create-vendor.dto';
import { ListVendorsQueryDto } from './dto/list-vendors-query.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorsService } from './vendors.service';

@ApiTags('Vendors')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  @ApiOperation({ summary: 'List vendors for authenticated account' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'vendorName', 'companyName', 'email'],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  list(@CurrentUser() user: JwtPayload, @Query() query: ListVendorsQueryDto) {
    return this.vendorsService.list(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vendor by id for authenticated account' })
  getById(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) vendorId: string,
  ) {
    return this.vendorsService.getById(user, vendorId);
  }

  @Post()
  @ApiOperation({ summary: 'Create vendor for authenticated account' })
  @ApiBody({ type: CreateVendorDto })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateVendorDto) {
    return this.vendorsService.create(user, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update vendor for authenticated account' })
  @ApiBody({ type: UpdateVendorDto })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) vendorId: string,
    @Body() dto: UpdateVendorDto,
  ) {
    return this.vendorsService.update(user, vendorId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete vendor for authenticated account' })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) vendorId: string,
  ) {
    return this.vendorsService.remove(user, vendorId);
  }
}

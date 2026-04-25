import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanySettingsService } from './company-settings.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';

@ApiTags('Company Settings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('company-settings')
export class CompanySettingsController {
  constructor(private readonly companySettingsService: CompanySettingsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get company settings for authenticated account' })
  getMySettings(@CurrentUser() user: JwtPayload) {
    return this.companySettingsService.getMySettings(user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Create or update company settings for authenticated account' })
  @ApiBody({ type: UpdateCompanySettingsDto })
  upsertMySettings(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCompanySettingsDto,
  ) {
    return this.companySettingsService.upsertMySettings(user, dto);
  }
}

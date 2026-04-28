import { Module } from '@nestjs/common';

// Placeholder — admin endpoints will be added in Phase 2.
// All admin endpoints must use: @UseGuards(JwtAuthGuard, RolesGuard) + @Roles('SUPER_ADMIN')
@Module({})
export class AdminModule {}

import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { PlanCatalogService } from './plan-catalog.service';
import { PlansService } from './plans.service';

@Module({
  controllers: [PlansController],
  providers: [PlansService, PlanCatalogService],
  exports: [PlansService],
})
export class PlansModule {}

import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { MockGateway } from './gateways/mock.gateway';
import { PashaGateway } from './gateways/pasha.gateway';
import { PaymentsService } from './payments.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, MockGateway, PashaGateway],
  exports: [PaymentsService],
})
export class PaymentsModule {}

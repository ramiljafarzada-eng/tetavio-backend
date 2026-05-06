import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CategoriesController } from './categories/categories.controller';
import { CategoriesService } from './categories/categories.service';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';
import { WarehousesController } from './warehouses/warehouses.controller';
import { WarehousesService } from './warehouses/warehouses.service';
import { StockController } from './stock/stock.controller';
import { StockService } from './stock/stock.service';
import { PurchaseOrdersController } from './purchase-orders/purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders/purchase-orders.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    CategoriesController,
    ProductsController,
    WarehousesController,
    StockController,
    PurchaseOrdersController,
  ],
  providers: [
    CategoriesService,
    ProductsService,
    WarehousesService,
    StockService,
    PurchaseOrdersService,
  ],
  exports: [StockService],
})
export class WarehouseModule {}

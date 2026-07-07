import { Module } from "@nestjs/common";
import { PurchaseOrdersController } from "./purchase-orders.controller";
import { SuppliersController } from "./suppliers.controller";
import { PurchaseOrdersService } from "./purchase-orders.service";

@Module({
  controllers: [PurchaseOrdersController, SuppliersController],
  providers: [PurchaseOrdersService],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}

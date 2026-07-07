import { Controller, Get } from "@nestjs/common";
import { PurchaseOrdersService } from "./purchase-orders.service";

@Controller("suppliers")
export class SuppliersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Get()
  async getSuppliers() {
    return this.purchaseOrdersService.findAllSuppliers();
  }
}

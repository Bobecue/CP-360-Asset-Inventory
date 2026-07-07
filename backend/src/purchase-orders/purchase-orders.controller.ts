import { Controller, Get, Post, Patch, Body, Param, Query } from "@nestjs/common";
import { PurchaseOrdersService } from "./purchase-orders.service";
import { POStatus } from "@prisma/client";

@Controller("purchase-orders")
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Get()
  async getPurchaseOrders(
    @Query("siteId") siteId?: string,
    @Query("status") status?: POStatus,
  ) {
    return this.purchaseOrdersService.findAll({ siteId, status });
  }

  @Get(":id")
  async getPurchaseOrderById(@Param("id") id: string) {
    return this.purchaseOrdersService.findOne(id);
  }

  @Post()
  async createPurchaseOrder(
    @Body()
    body: {
      supplierId: string;
      siteId: string;
      creatorId: string;
      items: { itemId: string; quantityOrdered: number; unitCost: number }[];
    },
  ) {
    return this.purchaseOrdersService.create(body);
  }

  @Post(":id/place")
  async placePurchaseOrder(@Param("id") id: string) {
    return this.purchaseOrdersService.placeOrder(id);
  }

  @Patch(":id/status")
  async updatePurchaseOrderStatus(
    @Param("id") id: string,
    @Body("status") status: POStatus,
  ) {
    return this.purchaseOrdersService.updateStatus(id, status);
  }
}

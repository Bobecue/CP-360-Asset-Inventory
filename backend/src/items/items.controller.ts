import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Headers, Req } from "@nestjs/common";
import { ItemsService } from "./items.service";

function getClientIp(req: any): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = forwarded ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0]).trim() : req.ip || req.socket?.remoteAddress;
  if (ip === "::1") return "127.0.0.1";
  if (ip && ip.startsWith("::ffff:")) return ip.substring(7);
  return ip || "127.0.0.1";
}

@Controller("items")
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get("low-stock")
  async getLowStockAlerts(
    @Query("siteId") siteId?: string,
    @Query("categoryId") categoryId?: string,
    @Query("severity") severity?: string,
  ) {
    return this.itemsService.getLowStockAlerts(siteId, categoryId, severity);
  }

  @Get()
  async getAllItems(
    @Query("categoryId") categoryId?: string,
    @Query("search") search?: string,
  ) {
    return this.itemsService.findAll(categoryId, search);
  }

  @Post()
  async createItem(
    @Headers("x-user-id") userId: string,
    @Req() req: any,
    @Body()
    body: {
      name: string;
      sku?: string;
      description?: string;
      unitPrice: number;
      leadTimeDays: number;
      categoryId: string;
      siteId?: string;
      quantity?: number;
    },
  ) {
    return this.itemsService.create(body, { userId, ipAddress: getClientIp(req) });
  }

  @Patch(":id")
  async updateItem(
    @Param("id") id: string,
    @Headers("x-user-id") userId: string,
    @Req() req: any,
    @Body()
    body: {
      name?: string;
      sku?: string;
      description?: string;
      unitPrice?: number;
      leadTimeDays?: number;
      categoryId?: string;
    },
  ) {
    return this.itemsService.update(id, body, { userId, ipAddress: getClientIp(req) });
  }

  @Delete(":id")
  async deleteItem(
    @Param("id") id: string,
    @Headers("x-user-id") userId: string,
    @Req() req: any,
  ) {
    return this.itemsService.remove(id, { userId, ipAddress: getClientIp(req) });
  }

  @Get(":id/assets")
  async getItemAssets(@Param("id") id: string) {
    return this.itemsService.findAssets(id);
  }

  @Get(":id/audit-logs")
  async getItemAuditLogs(@Param("id") id: string) {
    return this.itemsService.findAuditLogs(id);
  }

  @Patch(":id/stock")
  async updateStock(
    @Param("id") id: string,
    @Headers("x-user-id") userId: string,
    @Req() req: any,
    @Body()
    body: {
      siteId: string;
      quantity?: number;
      reorderPoint?: number;
      reason?: string;
      comments?: string;
      assetIdsToRemove?: string[];
    },
  ) {
    return this.itemsService.updateStock(
      id,
      body.siteId,
      body.quantity,
      body.reorderPoint,
      body.reason,
      body.comments,
      body.assetIdsToRemove,
      { userId, ipAddress: getClientIp(req) }
    );
  }

  @Patch(":id/assets/:assetId/status")
  async updateAssetStatus(
    @Param("id") id: string,
    @Param("assetId") assetId: string,
    @Headers("x-user-id") userId: string,
    @Req() req: any,
    @Body() body: { status: string; assignedToId?: string }
  ) {
    return this.itemsService.updateAssetStatus(
      id,
      assetId,
      body.status,
      body.assignedToId,
      { userId, ipAddress: getClientIp(req) }
    );
  }

  @Patch(":id/reorder-point")
  async updateReorderPoint(
    @Param("id") id: string,
    @Body() body: { siteId?: string; reorderPoint: number; reorderQuantity?: number }
  ) {
    return this.itemsService.updateReorderPoint(id, body);
  }
}

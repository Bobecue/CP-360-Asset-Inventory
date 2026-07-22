import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";

@Injectable()
export class ItemsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private auditLogsService: AuditLogsService,
  ) { }

  async findAll(categoryId?: string, search?: string) {
    const where: any = {};
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    return this.prisma.item.findMany({
      where,
      include: {
        category: true,
        stockLevels: true,
        assets: {
          include: {
            assignedTo: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async create(
    data: {
      name: string;
      sku?: string;
      description?: string;
      unitPrice: number;
      leadTimeDays: number;
      categoryId: string;
      siteId?: string;
      quantity?: number;
    },
    meta?: { userId?: string; ipAddress?: string },
  ) {
    // Check if category exists
    const category = await this.prisma.assetCategory.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) {
      throw new NotFoundException("Category not found.");
    }

    const isConsumable = category.type === "CONSUMABLE";
    const qty = (data.quantity !== undefined && data.quantity > 0) ? data.quantity : 1;

    const sites = await this.prisma.site.findMany();

    // Single catalog item logic
    let finalSku = data.sku?.trim().toUpperCase();
    let nextNum = 1;
    const categoryPrefix = category.prefix || "AST";
    const prefix = `AST-${categoryPrefix.toUpperCase()}-`;

    if (!finalSku) {
      // Find all matching items to compute true numerical maximum suffix
      const matchingItems = await this.prisma.item.findMany({
        where: { sku: { startsWith: prefix } },
        select: { sku: true },
      });
      if (matchingItems.length > 0) {
        const numbers = matchingItems.map((item) => {
          const parts = item.sku.split("-");
          const numStr = parts[parts.length - 1];
          const num = parseInt(numStr, 10);
          return isNaN(num) ? 0 : num;
        });
        nextNum = Math.max(...numbers, 0) + 1;
      }
    }

    // Create within a transaction with collision checking loop
    return this.prisma.$transaction(async (tx) => {
      if (!finalSku) {
        let isUnique = false;
        while (!isUnique) {
          finalSku = `${prefix}${String(nextNum).padStart(4, "0")}`;
          const duplicate = await tx.item.findUnique({
            where: { sku: finalSku },
          });
          if (!duplicate) {
            isUnique = true;
          } else {
            nextNum++;
          }
        }
      } else {
        const existingSku = await tx.item.findUnique({
          where: { sku: finalSku },
        });
        if (existingSku) {
          throw new ConflictException(`An item with Asset Tag "${finalSku}" already exists.`);
        }
      }

      const item = await tx.item.create({
        data: {
          name: data.name,
          sku: finalSku as string,
          description: data.description || null,
          unitPrice: data.unitPrice,
          leadTimeDays: data.leadTimeDays,
          categoryId: data.categoryId,
        },
      });

      if (sites.length > 0) {
        const stockData = sites.map((site) => ({
          siteId: site.id,
          itemId: item.id,
          quantity: (data.siteId === site.id) ? qty : 0,
          reorderPoint: 5,
        }));
        await tx.siteStock.createMany({
          data: stockData,
        });
      }

      // Generate physical assets for NON_CONSUMABLE categories
      if (!isConsumable && data.siteId) {
        const site = sites.find(s => s.id === data.siteId);
        const actualSitePrefix = (site?.prefix || "SYS").toUpperCase();
        const actualCategoryPrefix = (category.prefix || "AST").toUpperCase();
        const assetTagPrefix = `${actualSitePrefix}-${actualCategoryPrefix}-`;

        // Find current max sequential tagCode in Asset table for this category across all sites
        const matchingAssets = await tx.asset.findMany({
          where: { tagCode: { contains: `-${actualCategoryPrefix}-` } },
          select: { tagCode: true },
        });

        let assetNum = 1;
        if (matchingAssets.length > 0) {
          const numbers = matchingAssets.map((asset) => {
            const parts = asset.tagCode.split("-");
            const numStr = parts[parts.length - 1];
            const num = parseInt(numStr, 10);
            return isNaN(num) ? 0 : num;
          });
          assetNum = Math.max(...numbers, 0) + 1;
        }

        // Loop to create physical assets
        for (let i = 0; i < qty; i++) {
          let tagCode = "";
          let isUnique = false;
          while (!isUnique) {
            tagCode = `${assetTagPrefix}${String(assetNum).padStart(4, "0")}`;
            const duplicate = await tx.asset.findUnique({
              where: { tagCode },
            });
            if (!duplicate) {
              isUnique = true;
            }
            assetNum++; // Always increment
          }

          const serialNumber = `SN-${tagCode}`;

          await tx.asset.create({
            data: {
              itemId: item.id,
              siteId: data.siteId,
              status: "AVAILABLE",
              condition: "GOOD",
              tagCode,
              serialNumber,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          action: "ITEM_CREATED",
          details: `Item "${item.name}" (SKU: ${item.sku}) was created.`,
          userId: meta?.userId || null,
          itemId: item.id,
          itemName: item.name,
          itemSku: item.sku,
          ipAddress: meta?.ipAddress || null,
        },
      });

      return tx.item.findUnique({
        where: { id: item.id },
        include: { category: true, stockLevels: true },
      });
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      sku?: string;
      description?: string;
      unitPrice?: number;
      leadTimeDays?: number;
      categoryId?: string;
    },
    meta?: { userId?: string; ipAddress?: string },
  ) {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException("Catalog item not found.");
    }

    if (data.categoryId) {
      const category = await this.prisma.assetCategory.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        throw new NotFoundException("Category not found.");
      }
    }

    if (data.sku) {
      const existingSku = await this.prisma.item.findUnique({
        where: { sku: data.sku.toUpperCase() },
      });
      if (existingSku && existingSku.id !== id) {
        throw new ConflictException("An item with this SKU already exists.");
      }
    }

    const updatedItem = await this.prisma.item.update({
      where: { id },
      data: {
        name: data.name,
        sku: data.sku ? data.sku.toUpperCase() : undefined,
        description: data.description !== undefined ? (data.description || null) : undefined,
        unitPrice: data.unitPrice,
        leadTimeDays: data.leadTimeDays,
        categoryId: data.categoryId,
      },
      include: { category: true, stockLevels: true },
    });

    const changes: string[] = [];
    if (data.name && data.name !== item.name) changes.push(`Name: "${item.name}" -> "${data.name}"`);
    if (data.sku && data.sku.toUpperCase() !== item.sku) changes.push(`SKU: "${item.sku}" -> "${data.sku.toUpperCase()}"`);
    if (data.description !== undefined && (data.description || null) !== item.description) {
      changes.push(`Description: "${item.description || ''}" -> "${data.description || ''}"`);
    }
    if (data.unitPrice !== undefined && Number(data.unitPrice) !== Number(item.unitPrice)) {
      changes.push(`Unit Price: ${item.unitPrice} -> ${data.unitPrice}`);
    }
    if (data.leadTimeDays !== undefined && data.leadTimeDays !== item.leadTimeDays) {
      changes.push(`Lead Time: ${item.leadTimeDays} -> ${data.leadTimeDays}`);
    }

    if (changes.length > 0) {
      await this.prisma.auditLog.create({
        data: {
          action: "ITEM_UPDATED",
          details: `Item updated. Changes: ${changes.join(", ")}`,
          userId: meta?.userId || null,
          itemId: id,
          itemName: updatedItem.name,
          itemSku: updatedItem.sku,
          ipAddress: meta?.ipAddress || null,
        },
      });
    }

    return updatedItem;
  }

  async remove(id: string, meta?: { userId?: string; ipAddress?: string }) {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException("Catalog item not found.");
    }

    // Safety checks: Can't delete if assets are in use (not AVAILABLE)
    const activeAssetsCount = await this.prisma.asset.count({
      where: {
        itemId: id,
        status: { not: "AVAILABLE" },
      },
    });
    if (activeAssetsCount > 0) {
      throw new ConflictException("Cannot delete item as it has assets that are currently assigned or not available.");
    }

    // Delete associated requests, siteStocks, assets and the item inside transaction
    return this.prisma.$transaction(async (tx) => {
      await tx.request.deleteMany({ where: { itemId: id } });
      await tx.siteStock.deleteMany({ where: { itemId: id } });
      await tx.asset.deleteMany({ where: { itemId: id } });

      await tx.auditLog.create({
        data: {
          action: "ITEM_DELETED",
          details: `Item "${item.name}" (SKU: ${item.sku}) was deleted.`,
          userId: meta?.userId || null,
          itemId: id,
          itemName: item.name,
          itemSku: item.sku,
          ipAddress: meta?.ipAddress || null,
        },
      });

      return tx.item.delete({ where: { id } });
    });
  }

  async findAssets(itemId: string) {
    return this.prisma.asset.findMany({
      where: { itemId },
      orderBy: { tagCode: "asc" },
      include: {
        assignedTo: {
          select: { id: true, name: true }
        }
      },
    });
  }

  async updateAssetStatus(
    itemId: string,
    assetId: string,
    status: string,
    assignedToId?: string,
    meta?: { userId?: string; ipAddress?: string }
  ) {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      include: { item: true }
    });
    if (!asset || asset.itemId !== itemId) {
      throw new NotFoundException("Asset not found for this item.");
    }

    const updatedAsset = await this.prisma.$transaction(async (tx) => {
      const oldStatus = asset.status;
      const updated = await tx.asset.update({
        where: { id: assetId },
        data: {
          status: status as any,
          assignedToId: status === "ASSIGNED" ? (assignedToId || null) : null,
        },
        include: {
          assignedTo: true,
        }
      });

      let details = `Asset tag "${asset.tagCode}" status changed: ${oldStatus} -> ${status}`;
      if (status === "ASSIGNED" && updated.assignedTo) {
        details += ` (Assigned to: ${updated.assignedTo.name})`;
      }

      await tx.auditLog.create({
        data: {
          action: "STOCK_ADJUSTED",
          details,
          itemId,
          itemName: asset.item?.name || null,
          itemSku: asset.item?.sku || null,
          userId: meta?.userId || null,
          ipAddress: meta?.ipAddress || null,
        }
      });

      return updated;
    });

    return updatedAsset;
  }

  async updateStock(
    itemId: string,
    siteId: string,
    quantity?: number,
    reorderPoint?: number,
    reason?: string,
    comments?: string,
    assetIdsToRemove?: string[],
    meta?: { userId?: string; ipAddress?: string },
  ) {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      include: { category: true }
    });
    if (!item) {
      throw new NotFoundException("Catalog item not found.");
    }

    const site = await this.prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      throw new NotFoundException("Site not found.");
    }

    return this.prisma.$transaction(async (tx) => {
      const existingStock = await tx.siteStock.findUnique({ where: { siteId_itemId: { siteId, itemId } } });
      const oldQty = existingStock?.quantity || 0;
      const oldReorder = existingStock?.reorderPoint || 5;

      const stock = await tx.siteStock.upsert({
        where: { siteId_itemId: { siteId, itemId } },
        update: {
          quantity: quantity !== undefined ? quantity : undefined,
          reorderPoint: reorderPoint !== undefined ? reorderPoint : undefined,
        },
        create: { siteId, itemId, quantity: quantity ?? 0, reorderPoint: reorderPoint ?? 5 },
      });

      const isConsumable = item.category.type === "CONSUMABLE";
      if (!isConsumable && quantity !== undefined) {
        if (quantity > oldQty) {
          const actualSitePrefix = (site.prefix || "SYS").toUpperCase();
          const actualCategoryPrefix = (item.category.prefix || "AST").toUpperCase();
          const assetTagPrefix = `${actualSitePrefix}-${actualCategoryPrefix}-`;
          const matchingAssets = await tx.asset.findMany({ where: { tagCode: { contains: `-${actualCategoryPrefix}-` } }, select: { tagCode: true } });
          let assetNum = matchingAssets.length > 0
            ? Math.max(...matchingAssets.map(a => parseInt(a.tagCode.split("-").pop() || "0")), 0) + 1
            : 1;
          for (let i = 0; i < (quantity - oldQty); i++) {
            let tagCode = "";
            let isUnique = false;
            while (!isUnique) {
              tagCode = `${assetTagPrefix}${String(assetNum++).padStart(4, "0")}`;
              if (!(await tx.asset.findUnique({ where: { tagCode } }))) isUnique = true;
            }
            await tx.asset.create({ data: { itemId, siteId, status: "AVAILABLE", condition: "GOOD", tagCode, serialNumber: `SN-${tagCode}` } });
          }
        } else if (quantity < oldQty) {
          // Auto-select oldest AVAILABLE assets at this site if no explicit list is provided
          const toRemove = (assetIdsToRemove && assetIdsToRemove.length > 0)
            ? assetIdsToRemove
            : (await tx.asset.findMany({
              where: { itemId, siteId, status: "AVAILABLE" },
              orderBy: { createdAt: "asc" },
              take: oldQty - quantity,
            })).map(a => a.id);

          if (toRemove.length > 0) {
            const retireCondition = reason === "DAMAGED_OR_BROKEN" ? "DAMAGED"
              : reason === "LOST_OR_STOLEN" ? "LOST"
                : "RETIRED";
            await tx.asset.updateMany({
              where: { id: { in: toRemove } },
              data: { status: "RETIRED", condition: retireCondition },
            });
          }
        }
      }

      const changes = [];
      if (quantity !== undefined && quantity !== oldQty) changes.push(`Quantity: ${oldQty} -> ${quantity}`);
      if (reorderPoint !== undefined && reorderPoint !== oldReorder) changes.push(`Reorder Point: ${oldReorder} -> ${reorderPoint}`);
      if (changes.length > 0) {
        let details = `Stock levels adjusted at site "${site.name}" (${site.prefix}). Changes: ${changes.join(", ")}`;
        if (reason) details += `. Reason: ${reason}`;
        if (comments) details += `. Comments: ${comments}`;
        await tx.auditLog.create({
          data: {
            action: "STOCK_ADJUSTED",
            details,
            userId: meta?.userId || null,
            itemId,
            itemName: item.name,
            itemSku: item.sku,
            ipAddress: meta?.ipAddress || null,
          },
        });
      }
      await this.notificationsService.checkAndTriggerLowStockAlert(itemId, siteId, stock.quantity, stock.reorderPoint);
      return stock;
    });
  }

  async findAuditLogs(itemId: string) {
    return this.prisma.auditLog.findMany({
      where: { itemId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getLowStockAlerts(siteId?: string, categoryId?: string, severity?: string) {
    const items = await this.prisma.item.findMany({
      include: {
        category: true,
        stockLevels: {
          include: {
            site: true
          }
        },
        assets: true,
      },
      orderBy: { name: 'asc' }
    });

    const alerts: any[] = [];

    for (const item of items) {
      if (categoryId && categoryId !== 'ALL' && item.categoryId !== categoryId) continue;

      const defaultRP = item.reorderPoint || 5;

      if (siteId && siteId !== 'ALL') {
        const siteStock = (item.stockLevels || []).find(s => s.siteId === siteId);
        let currentQty = siteStock ? siteStock.quantity : 0;
        if (!siteStock && item.assets && item.assets.length > 0) {
          currentQty = item.assets.filter((a: any) => a.siteId === siteId && (a.status === 'AVAILABLE' || a.status === 'ASSIGNED')).length;
        }

        const rp = siteStock?.reorderPoint ?? defaultRP;

        if (currentQty <= rp) {
          const isCritical = currentQty === 0 || currentQty <= Math.floor(rp / 2);
          const itemSeverity = isCritical ? 'CRITICAL' : 'WARNING';

          if (!severity || severity === 'ALL' || itemSeverity === severity) {
            alerts.push({
              id: item.id,
              itemId: item.id,
              name: item.name,
              sku: item.sku,
              unitPrice: item.unitPrice,
              leadTimeDays: item.leadTimeDays,
              reorderPoint: rp,
              reorderQuantity: item.reorderQuantity || 10,
              currentQuantity: currentQty,
              severity: itemSeverity,
              category: item.category,
              stockLevels: item.stockLevels,
              daysBelowThreshold: Math.max(1, Math.floor((Date.now() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24)))
            });
          }
        }
      } else {
        // ALL SITES selected
        const stockLevels = item.stockLevels || [];
        const lowSiteStocks = stockLevels.filter(s => s.quantity <= (s.reorderPoint || defaultRP));
        const totalStockQty = stockLevels.reduce((sum, s) => sum + s.quantity, 0);

        const isLowOverall = stockLevels.length === 0 ? true : lowSiteStocks.length > 0 || totalStockQty <= defaultRP;

        if (isLowOverall) {
          const minQty = stockLevels.length > 0 ? Math.min(...stockLevels.map(s => s.quantity)) : 0;
          const isCritical = minQty === 0 || minQty <= Math.floor(defaultRP / 2) || totalStockQty <= Math.floor(defaultRP / 2);
          const itemSeverity = isCritical ? 'CRITICAL' : 'WARNING';

          if (!severity || severity === 'ALL' || itemSeverity === severity) {
            alerts.push({
              id: item.id,
              itemId: item.id,
              name: item.name,
              sku: item.sku,
              unitPrice: item.unitPrice,
              leadTimeDays: item.leadTimeDays,
              reorderPoint: defaultRP,
              reorderQuantity: item.reorderQuantity || 10,
              currentQuantity: totalStockQty,
              severity: itemSeverity,
              category: item.category,
              stockLevels: item.stockLevels,
              daysBelowThreshold: Math.max(1, Math.floor((Date.now() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24)))
            });
          }
        }
      }
    }

    const totalAlerts = alerts.length;
    const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL').length;
    const warningAlerts = alerts.filter(a => a.severity === 'WARNING').length;
    const totalItemsToReorder = alerts.reduce((sum, a) => sum + Math.max(1, a.reorderPoint - a.currentQuantity), 0);

    return {
      stats: {
        totalAlerts,
        criticalAlerts,
        warningAlerts,
        totalItemsToReorder
      },
      alerts
    };
  }

  async updateReorderPoint(itemId: string, data: { siteId?: string; reorderPoint: number; reorderQuantity?: number }) {
    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Item not found');

    const updated = await this.prisma.item.update({
      where: { id: itemId },
      data: {
        reorderPoint: Number(data.reorderPoint),
        ...(data.reorderQuantity ? { reorderQuantity: Number(data.reorderQuantity) } : {})
      }
    });

    if (data.siteId) {
      await this.prisma.siteStock.updateMany({
        where: { itemId, siteId: data.siteId },
        data: { reorderPoint: Number(data.reorderPoint) }
      });
    } else {
      await this.prisma.siteStock.updateMany({
        where: { itemId },
        data: { reorderPoint: Number(data.reorderPoint) }
      });
    }

    return updated;
  }
}

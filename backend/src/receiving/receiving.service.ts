import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { POStatus, CategoryType, AssetStatus } from "@prisma/client";

@Injectable()
export class ReceivingService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    purchaseOrderId: string;
    receivedById: string;
    siteId: string;
    deliveryNoteRef?: string;
    invoiceNumber?: string;
    invoiceFileUrl?: string;
    items: { itemId: string; quantityReceived: number; serials?: string[] }[];
    ipAddress?: string;
  }) {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException("A receiving report must contain at least one item.");
    }

    // Run inside a database transaction to ensure transactional consistency
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate PO exists and is orderable
      const po = await tx.purchaseOrder.findUnique({
        where: { id: data.purchaseOrderId },
        include: { items: true },
      });

      if (!po) {
        throw new NotFoundException(`Purchase Order with ID ${data.purchaseOrderId} not found.`);
      }

      if (po.status !== POStatus.ORDERED && po.status !== POStatus.PARTIALLY_RECEIVED) {
        throw new BadRequestException(
          `Cannot receive items for Purchase Order with status: ${po.status}`,
        );
      }

      // 2. Validate Site exists
      const site = await tx.site.findUnique({ where: { id: data.siteId } });
      if (!site) {
        throw new NotFoundException(`Site with ID ${data.siteId} not found.`);
      }

      // 3. Generate sequential RR number
      const rrCount = await tx.receivingReport.count();
      const rrNumber = `RR-${String(rrCount + 1).padStart(5, "0")}`;

      // 4. Create the main Receiving Report
      const report = await tx.receivingReport.create({
        data: {
          rrNumber,
          deliveryNoteRef: data.deliveryNoteRef || null,
          invoiceNumber: data.invoiceNumber || null,
          invoiceFileUrl: data.invoiceFileUrl || null,
          purchaseOrderId: data.purchaseOrderId,
          siteId: data.siteId,
          receivedById: data.receivedById,
        },
      });

      // 5. Loop through items to receive
      for (const receivedItem of data.items) {
        const poItem = po.items.find((pi) => pi.itemId === receivedItem.itemId);
        if (!poItem) {
          throw new BadRequestException(
            `Item with ID ${receivedItem.itemId} is not part of this Purchase Order.`,
          );
        }

        const item = await tx.item.findUnique({
          where: { id: receivedItem.itemId },
          include: { category: true },
        });

        if (!item) {
          throw new NotFoundException(`Item with ID ${receivedItem.itemId} not found.`);
        }

        const isConsumable = item.category.type === CategoryType.CONSUMABLE;

        if (isConsumable) {
          // A. Consumable Workflow: Simple stock level increment
          const stock = await tx.siteStock.findUnique({
            where: { siteId_itemId: { siteId: data.siteId, itemId: receivedItem.itemId } },
          });

          if (stock) {
            await tx.siteStock.update({
              where: { id: stock.id },
              data: { quantity: { increment: receivedItem.quantityReceived } },
            });
          } else {
            await tx.siteStock.create({
              data: {
                siteId: data.siteId,
                itemId: receivedItem.itemId,
                quantity: receivedItem.quantityReceived,
                reorderPoint: 5,
              },
            });
          }
        } else {
          // B. Non-Consumable Workflow: Enforce unique serial numbers and register individual assets
          const serials = receivedItem.serials || [];
          if (serials.length !== receivedItem.quantityReceived) {
            throw new BadRequestException(
              `Item "${item.name}" is non-consumable. You must provide exactly ${receivedItem.quantityReceived} serial numbers.`,
            );
          }

          // Check for duplicate serials in input payload
          const uniqueSerials = new Set(serials);
          if (uniqueSerials.size !== serials.length) {
            throw new BadRequestException(
              `Duplicate serial numbers provided for item "${item.name}".`,
            );
          }

          // Query current count of assets to compute sequential tag codes
          const prefixPattern = `${site.prefix}-${item.category.prefix}-`;
          const countAssets = await tx.asset.count({
            where: {
              tagCode: {
                startsWith: prefixPattern,
              },
            },
          });

          let currentSeq = countAssets + 1;

          for (const serial of serials) {
            // Verify serial is unique system-wide
            const existingAsset = await tx.asset.findUnique({ where: { serialNumber: serial } });
            if (existingAsset) {
              throw new BadRequestException(`Serial number "${serial}" is already registered in the system.`);
            }

            const tagCode = `${site.prefix}-${item.category.prefix}-${String(currentSeq).padStart(4, "0")}`;
            currentSeq++;

            // Create individual serialized Asset record linked to this receipt
            await tx.asset.create({
              data: {
                serialNumber: serial,
                tagCode,
                status: AssetStatus.AVAILABLE,
                condition: "GOOD",
                itemId: receivedItem.itemId,
                siteId: data.siteId,
                receivingReportId: report.id,
              },
            });
          }

          // Update SiteStock quantity (should match number of newly registered assets)
          const stock = await tx.siteStock.findUnique({
            where: { siteId_itemId: { siteId: data.siteId, itemId: receivedItem.itemId } },
          });

          if (stock) {
            await tx.siteStock.update({
              where: { id: stock.id },
              data: { quantity: { increment: receivedItem.quantityReceived } },
            });
          } else {
            await tx.siteStock.create({
              data: {
                siteId: data.siteId,
                itemId: receivedItem.itemId,
                quantity: receivedItem.quantityReceived,
                reorderPoint: 5,
              },
            });
          }
        }

        // C. Update quantityReceived on the Purchase Order Item
        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: { quantityReceived: { increment: receivedItem.quantityReceived } },
        });

        // D. Create historical ReceivingReportItem receipt line
        await tx.receivingReportItem.create({
          data: {
            receivingReportId: report.id,
            itemId: receivedItem.itemId,
            quantityReceived: receivedItem.quantityReceived,
          },
        });

        // E. Log individual received item SKU in AuditLog
        await tx.auditLog.create({
          data: {
            action: "ITEM_RECEIVED",
            details: `Received ${receivedItem.quantityReceived} units of "${item.name}" (SKU: ${item.sku}) at site "${site.name}".`,
            ipAddress: data.ipAddress || null,
            userId: data.receivedById,
            itemId: item.id,
            itemName: item.name,
            itemSku: item.sku,
          },
        });
      }

      // 6. Check PO fulfillment status to auto-close or flag partially received
      const updatedPoItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: data.purchaseOrderId },
      });

      const allFullyReceived = updatedPoItems.every(
        (pi) => pi.quantityReceived >= pi.quantityOrdered,
      );

      await tx.purchaseOrder.update({
        where: { id: data.purchaseOrderId },
        data: {
          status: allFullyReceived ? POStatus.RECEIVED : POStatus.PARTIALLY_RECEIVED,
        },
      });

      // 7. Log Receiving Report creation in AuditLog
      await tx.auditLog.create({
        data: {
          action: "RECEIVING_REPORT_CREATED",
          details: `Created Receiving Report ${rrNumber} for PO ${po.poNumber} at site "${site.name}".`,
          ipAddress: data.ipAddress || null,
          userId: data.receivedById,
        },
      });

      // 8. Return populated receipt report
      return tx.receivingReport.findUnique({
        where: { id: report.id },
        include: {
          receivedItems: {
            include: {
              item: true,
            },
          },
          assetsIntroduced: true,
          site: true,
          receivedBy: { select: { id: true, name: true } },
        },
      });
    });
  }

  async findAll(filters: { siteId?: string }) {
    const where: any = {};
    if (filters.siteId) {
      where.siteId = filters.siteId;
    }

    return this.prisma.receivingReport.findMany({
      where,
      include: {
        purchaseOrder: { select: { id: true, poNumber: true } },
        site: { select: { id: true, name: true, prefix: true } },
        receivedBy: { select: { id: true, name: true } },
        receivedItems: {
          include: {
            item: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const report = await this.prisma.receivingReport.findUnique({
      where: { id },
      include: {
        purchaseOrder: true,
        site: true,
        receivedBy: { select: { id: true, name: true, email: true } },
        receivedItems: {
          include: {
            item: {
              include: {
                category: true,
              },
            },
          },
        },
        assetsIntroduced: true,
      },
    });

    if (!report) {
      throw new NotFoundException(`Receiving Report with ID ${id} not found.`);
    }

    return report;
  }
}

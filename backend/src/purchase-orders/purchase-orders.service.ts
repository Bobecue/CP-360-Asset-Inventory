import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { POStatus } from "@prisma/client";

@Injectable()
export class PurchaseOrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: { siteId?: string; status?: POStatus }) {
    const whereClause: any = {};
    if (filters.siteId) {
      whereClause.siteId = filters.siteId;
    }
    if (filters.status) {
      whereClause.status = filters.status;
    }

    return this.prisma.purchaseOrder.findMany({
      where: whereClause,
      include: {
        supplier: { select: { id: true, name: true } },
        site: { select: { id: true, name: true, prefix: true } },
        creator: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            item: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        site: true,
        creator: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            item: {
              include: {
                category: true,
              },
            },
          },
        },
        receivingReports: {
          include: {
            receivedBy: { select: { id: true, name: true } },
            receivedItems: {
              include: {
                item: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!po) {
      throw new NotFoundException(`Purchase Order with ID ${id} not found.`);
    }

    return po;
  }

  async create(data: {
    supplierId: string;
    siteId: string;
    creatorId: string;
    items: { itemId: string; quantityOrdered: number; unitCost: number }[];
  }) {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException("A Purchase Order must contain at least one item.");
    }

    const count = await this.prisma.purchaseOrder.count();
    const poNumber = `PO-${String(count + 1).padStart(5, "0")}`;

    // Create the PO inside a transaction
    return this.prisma.purchaseOrder.create({
      data: {
        poNumber,
        status: POStatus.DRAFT,
        supplierId: data.supplierId,
        siteId: data.siteId,
        creatorId: data.creatorId,
        items: {
          create: data.items.map((item) => ({
            itemId: item.itemId,
            quantityOrdered: item.quantityOrdered,
            unitCost: item.unitCost,
          })),
        },
      },
      include: {
        items: true,
      },
    });
  }

  async placeOrder(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) {
      throw new NotFoundException(`Purchase Order with ID ${id} not found.`);
    }
    if (po.status !== POStatus.DRAFT) {
      throw new BadRequestException(`Only DRAFT Purchase Orders can be placed. Current status: ${po.status}`);
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: POStatus.ORDERED },
    });
  }

  async updateStatus(id: string, status: POStatus) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) {
      throw new NotFoundException(`Purchase Order with ID ${id} not found.`);
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status },
    });
  }

  async findAllSuppliers() {
    return this.prisma.supplier.findMany({
      orderBy: { name: "asc" },
    });
  }
}

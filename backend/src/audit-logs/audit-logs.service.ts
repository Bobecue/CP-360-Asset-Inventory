import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    action: string;
    details?: string;
    ipAddress?: string;
    userId?: string;
    itemId?: string;
    itemName?: string;
    itemSku?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        action: data.action,
        details: data.details || null,
        ipAddress: data.ipAddress || null,
        userId: data.userId || null,
        itemId: data.itemId || null,
        itemName: data.itemName || null,
        itemSku: data.itemSku || null,
      },
    });
  }

  async findAll(query: { itemId?: string; userId?: string; limit?: string } = {}) {
    const where: any = {};
    if (query.itemId) {
      where.itemId = query.itemId;
    }
    if (query.userId) {
      where.userId = query.userId;
    }

    const limit = query.limit ? parseInt(query.limit, 10) : 100;

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            siteId: true,
          },
        },
        item: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: isNaN(limit) ? 100 : limit,
    });
  }
}

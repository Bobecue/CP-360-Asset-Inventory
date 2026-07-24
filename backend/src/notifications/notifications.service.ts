import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async markAsRead(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException("Notification not found.");
    }
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async create(data: { title: string; message: string; userId: string }) {
    return this.prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        userId: data.userId,
      },
    });
  }

  async checkAndTriggerLowStockAlert(itemId: string, siteId: string, quantity: number, reorderPoint: number) {
    if (quantity <= reorderPoint) {
      const item = await this.prisma.item.findUnique({ where: { id: itemId } });
      if (!item) return;

      const site = siteId && siteId !== 'ALL' ? await this.prisma.site.findUnique({ where: { id: siteId } }) : null;
      const siteText = site?.name ? ` at "${site.name}"` : '';

      const alertUsers = await this.prisma.user.findMany({
        where: {
          role: { in: ["SUPER_ADMIN", "ADMIN", "INVENTORY_STAFF"] }
        },
      });

      const title = "Low Stock Warning";
      const message = `Stock level for "${item.name}"${siteText} has dropped to ${quantity} (Reorder threshold: ${reorderPoint}).`;

      for (const u of alertUsers) {
        const existing = await this.prisma.notification.findFirst({
          where: {
            userId: u.id,
            title: "Low Stock Warning",
            message: { contains: `"${item.name}"` },
            isRead: false
          }
        });

        if (!existing) {
          await this.create({
            title,
            message,
            userId: u.id,
          });
        }
      }
    }
  }
}

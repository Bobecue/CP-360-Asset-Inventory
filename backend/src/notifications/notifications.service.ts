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
      const site = await this.prisma.site.findUnique({ where: { id: siteId } });
      if (!item || !site) return;

      // Find all SUPER_ADMINs, plus site-scoped ADMINs/INVENTORY_STAFF
      const alertUsers = await this.prisma.user.findMany({
        where: {
          OR: [
            { role: "SUPER_ADMIN" },
            {
              siteId,
              role: { in: ["ADMIN", "INVENTORY_STAFF"] },
            },
          ],
        },
      });

      const title = "Low Stock Warning";
      const message = `Stock level for "${item.name}" at "${site.name}" has dropped to ${quantity} (Reorder threshold: ${reorderPoint}).`;

      // Create notifications for all these users
      for (const u of alertUsers) {
        await this.create({
          title,
          message,
          userId: u.id,
        });
      }
    }
  }
}

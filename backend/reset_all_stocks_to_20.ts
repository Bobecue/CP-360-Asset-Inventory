import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not defined");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting stock reset to 20, logging adjustments, and cleaning asset movements...");

  // 1. Find a Super Admin or system user to attribute the audit logs to
  const systemUser = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  }) || await prisma.user.findFirst();

  const userId = systemUser?.id || null;

  // 2. Clear all asset movements and request records
  const deletedAssetEvents = await prisma.assetEvent.deleteMany({});
  console.log(`Deleted ${deletedAssetEvents.count} AssetEvents.`);

  const deletedRequestEvents = await prisma.requestEvent.deleteMany({});
  console.log(`Deleted ${deletedRequestEvents.count} RequestEvents.`);

  const deletedRequests = await prisma.request.deleteMany({});
  console.log(`Deleted ${deletedRequests.count} Requests.`);

  const deletedNotifications = await prisma.notification.deleteMany({});
  console.log(`Deleted ${deletedNotifications.count} Notifications.`);

  // 3. Reset all Assets status to AVAILABLE and clear assignment
  const updatedAssets = await prisma.asset.updateMany({
    data: {
      status: 'AVAILABLE',
      condition: 'GOOD',
      assignedToId: null,
    }
  });
  console.log(`Reset ${updatedAssets.count} Assets to AVAILABLE status.`);

  // 4. Reset all SiteStock records to quantity = 20 & record stock adjustments in AuditLog
  const allSiteStocks = await prisma.siteStock.findMany({
    include: {
      item: true,
      site: true,
    }
  });

  console.log(`Found ${allSiteStocks.length} site stock records to adjust to 20.`);

  for (const stock of allSiteStocks) {
    const oldQty = stock.quantity;
    const newQty = 20;
    const diff = newQty - oldQty;

    // Update stock quantity to 20
    await prisma.siteStock.update({
      where: { id: stock.id },
      data: { quantity: newQty }
    });

    // Record stock adjustment in audit log
    const siteName = stock.site?.name || stock.siteId;
    const itemName = stock.item?.name || 'Item';
    const itemSku = stock.item?.sku || null;

    await prisma.auditLog.create({
      data: {
        action: 'STOCK_ADJUSTMENT',
        details: `System stock reset to 20 for "${itemName}" at ${siteName} (Previous: ${oldQty}, New: 20, Change: ${diff >= 0 ? '+' : ''}${diff})`,
        itemId: stock.itemId,
        itemName: itemName,
        itemSku: itemSku,
        userId: userId,
      }
    });
  }

  console.log("Successfully reset all site stocks to 20, recorded audit logs, and cleaned all asset movements!");
}

main()
  .catch((err) => {
    console.error("Error during stock reset and cleaning:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

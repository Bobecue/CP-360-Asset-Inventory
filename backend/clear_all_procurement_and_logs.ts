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
  console.log('Starting full procurement, orders, reports & logs cleanup...');

  // 1. Delete Receiving Report Items & Receiving Reports
  const rrItems = await prisma.receivingReportItem.deleteMany({});
  console.log(`Deleted ${rrItems.count} ReceivingReportItem records.`);

  const rrs = await prisma.receivingReport.deleteMany({});
  console.log(`Deleted ${rrs.count} ReceivingReport records.`);

  // 2. Delete Purchase Order Items & Purchase Orders
  const poItems = await prisma.purchaseOrderItem.deleteMany({});
  console.log(`Deleted ${poItems.count} PurchaseOrderItem records.`);

  const pos = await prisma.purchaseOrder.deleteMany({});
  console.log(`Deleted ${pos.count} PurchaseOrder records.`);

  // 3. Delete Request Events & Requests
  const reqEvents = await prisma.requestEvent.deleteMany({});
  console.log(`Deleted ${reqEvents.count} RequestEvent records.`);

  const requests = await prisma.request.deleteMany({});
  console.log(`Deleted ${requests.count} Request records.`);

  // 4. Delete Asset Events
  const assetEvents = await prisma.assetEvent.deleteMany({});
  console.log(`Deleted ${assetEvents.count} AssetEvent records.`);

  // 5. Delete Audit Logs
  const auditLogs = await prisma.auditLog.deleteMany({});
  console.log(`Deleted ${auditLogs.count} AuditLog records.`);

  // 6. Delete Notifications
  const notifications = await prisma.notification.deleteMany({});
  console.log(`Deleted ${notifications.count} Notification records.`);

  console.log('\nAll Purchase Orders, Receiving Reports, Request Orders, and Reports/Logs cleared successfully!');
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});

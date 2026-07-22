/**
 * Backfill: Deduct SiteStock for existing RELEASED deployment requests
 * that were created before the stock-deduction fix was applied.
 *
 * Run with:
 *   npx ts-node -r tsconfig-paths/register src/backfill-stock-deductions.ts
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL environment variable is not defined');

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);


async function main() {
  // Find all RELEASED (active deployment) requests whose reason indicates
  // they were created via [ASSET DEPLOYMENT]. These never had stock deducted.
  const deployments = await prisma.request.findMany({
    where: {
      status: 'RELEASED',
      purpose: { contains: '[ASSET DEPLOYMENT]' },
    },
    include: {
      asset: true,
      requester: true,
    },
  });

  console.log(`Found ${deployments.length} active RELEASED deployment request(s) to fix.`);

  let fixed = 0;
  let skipped = 0;

  for (const req of deployments) {
    // Determine site ID from asset → requester → purpose JSON
    let siteId: string | undefined =
      req.asset?.siteId ?? req.requester?.siteId ?? undefined;

    if (!siteId && req.purpose) {
      try {
        const parsed = JSON.parse(req.purpose);
        siteId = parsed.siteId;
      } catch {
        // ignore parse errors
      }
    }

    if (!siteId) {
      console.warn(`  [SKIP] Request ${req.id} – could not determine siteId.`);
      skipped++;
      continue;
    }

    let quantity = 1;
    try {
      if (req.purpose && req.purpose.startsWith('{')) {
        const parsed = JSON.parse(req.purpose);
        quantity = parsed.quantity || 1;
      }
    } catch {
      // default to 1
    }

    // Find the SiteStock record for this item + site
    const stock = await prisma.siteStock.findFirst({
      where: { siteId, itemId: req.itemId },
    });

    if (!stock) {
      console.warn(
        `  [SKIP] Request ${req.id} – no SiteStock row for site=${siteId} item=${req.itemId}.`,
      );
      skipped++;
      continue;
    }

    // Only deduct if stock is > 0 to avoid going negative
    const newQty = Math.max(0, stock.quantity - quantity);
    await prisma.siteStock.update({
      where: { id: stock.id },
      data: { quantity: newQty },
    });

    console.log(
      `  [OK] Request ${req.id} – stock for item ${req.itemId} at site ${siteId}: ${stock.quantity} → ${newQty}`,
    );
    fixed++;
  }

  console.log(`\nDone. Fixed: ${fixed}, Skipped: ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

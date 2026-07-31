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
  // Find all RETURNED requests
  const returnedRequests = await prisma.request.findMany({
    where: {
      status: 'RETURNED',
    },
    include: {
      asset: true,
      requester: true,
      item: true,
    },
  });

  console.log(`Found ${returnedRequests.length} RETURNED request(s) to process.`);

  let restoredCount = 0;

  for (const req of returnedRequests) {
    let parsedPurpose: any = {};
    try {
      if (req.purpose) parsedPurpose = JSON.parse(req.purpose);
    } catch {}

    const rawSiteId = parsedPurpose.sourceSiteId || parsedPurpose.siteId || req.requester?.siteId;
    let targetSiteId: string | undefined = undefined;

    if (rawSiteId) {
      const siteObj = await prisma.site.findFirst({
        where: {
          OR: [
            { id: rawSiteId },
            { name: { equals: rawSiteId, mode: 'insensitive' } },
            { prefix: { equals: rawSiteId, mode: 'insensitive' } }
          ]
        }
      });
      if (siteObj) {
        targetSiteId = siteObj.id;
      } else {
        targetSiteId = rawSiteId;
      }
    }

    const targetItemId = req.itemId || req.asset?.itemId;
    if (!targetItemId) {
      console.warn(`[SKIP] Request ${req.id} - missing itemId`);
      continue;
    }

    const totalQty = parsedPurpose.quantity || (req as any).quantity || 1;
    const commentLower = (parsedPurpose.returnComment || req.comments || '').toLowerCase();
    const itemsMissingMatch = commentLower.match(/\[missing:\s*(\d+)\]/i);
    const itemsMissing = itemsMissingMatch ? parseInt(itemsMissingMatch[1], 10) : (commentLower.includes('missing') ? 1 : 0);
    const effectiveReturnQty = Math.max(0, totalQty - itemsMissing);

    if (effectiveReturnQty <= 0) {
      console.log(`[SKIP] Request ${req.id} - 0 return qty`);
      continue;
    }

    // Restore physical asset status if present
    const tagsToRestore: string[] = [];
    if (parsedPurpose.assetTag) {
      parsedPurpose.assetTag.split(/,\s*/).forEach((t: string) => { if (t && t.trim()) tagsToRestore.push(t.trim()); });
    }
    if (Array.isArray(parsedPurpose.assetTags)) {
      parsedPurpose.assetTags.forEach((t: string) => { if (t && t.trim()) tagsToRestore.push(t.trim()); });
    }

    if (tagsToRestore.length > 0) {
      await prisma.asset.updateMany({
        where: { tagCode: { in: tagsToRestore } },
        data: {
          status: 'AVAILABLE',
          condition: 'GOOD',
          assignedToId: null,
          ...(targetSiteId ? { siteId: targetSiteId } : {})
        }
      });
    } else if (req.assetId) {
      await prisma.asset.update({
        where: { id: req.assetId },
        data: {
          status: 'AVAILABLE',
          condition: 'GOOD',
          assignedToId: null,
          ...(targetSiteId ? { siteId: targetSiteId } : {})
        }
      });
    }

    // Restore stock (specific site only)
    if (targetSiteId) {
      const stock = await prisma.siteStock.findFirst({
        where: { siteId: targetSiteId, itemId: targetItemId }
      });

      if (stock) {
        await prisma.siteStock.update({
          where: { id: stock.id },
          data: { quantity: { increment: effectiveReturnQty } }
        });
        console.log(`[RESTORED] Request ${req.id} -> Item ${req.item?.name || targetItemId} (+${effectiveReturnQty} stock at site ${targetSiteId})`);
        restoredCount++;
      } else {
        await prisma.siteStock.create({
          data: {
            siteId: targetSiteId,
            itemId: targetItemId,
            quantity: effectiveReturnQty
          }
        });
        console.log(`[CREATED & RESTORED] Request ${req.id} -> Item ${req.item?.name || targetItemId} (${effectiveReturnQty} stock at site ${targetSiteId})`);
        restoredCount++;
      }
    } else {
      const fallbackStock = await prisma.siteStock.findFirst({
        where: { itemId: targetItemId }
      });
      if (fallbackStock) {
        await prisma.siteStock.update({
          where: { id: fallbackStock.id },
          data: { quantity: { increment: effectiveReturnQty } }
        });
        console.log(`[RESTORED FALLBACK] Request ${req.id} -> Item ${req.item?.name || targetItemId} (+${effectiveReturnQty} stock)`);
        restoredCount++;
      }
    }
  }

  console.log(`\nComplete! Successfully reconciled and restored stock for ${restoredCount} RETURNED request(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

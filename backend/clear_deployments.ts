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
  // 1. Find all requests marked with [ASSET DEPLOYMENT]
  const deploymentRequests = await prisma.request.findMany({
    where: {
      purpose: {
        contains: '[ASSET DEPLOYMENT]'
      }
    },
    select: {
      id: true,
      assetId: true,
    }
  });

  const reqIds = deploymentRequests.map(r => r.id);
  const assetIds = deploymentRequests.map(r => r.assetId).filter(Boolean) as string[];

  console.log(`Found ${reqIds.length} asset deployment requests to clear.`);

  if (reqIds.length > 0) {
    // 2. Delete RequestEvents linked to deployment requests
    const deletedReqEvents = await prisma.requestEvent.deleteMany({
      where: {
        requestId: { in: reqIds }
      }
    });
    console.log(`Deleted ${deletedReqEvents.count} RequestEvents.`);

    // 3. Delete AssetEvents linked to deployment requests or with 'DEPLOYED' action
    const deletedAssetEvents = await prisma.assetEvent.deleteMany({
      where: {
        OR: [
          { requestId: { in: reqIds } },
          { action: 'DEPLOYED' }
        ]
      }
    });
    console.log(`Deleted ${deletedAssetEvents.count} AssetEvents.`);

    // 4. Reset linked assets to AVAILABLE
    const updatedAssets = await prisma.asset.updateMany({
      where: {
        OR: [
          { id: { in: assetIds } },
          { status: 'ASSIGNED' }
        ]
      },
      data: {
        status: 'AVAILABLE',
        assignedToId: null,
      }
    });
    console.log(`Reset ${updatedAssets.count} Assets to AVAILABLE status.`);

    // 5. Delete deployment Requests
    const deletedRequests = await prisma.request.deleteMany({
      where: {
        id: { in: reqIds }
      }
    });
    console.log(`Deleted ${deletedRequests.count} Asset Deployment requests.`);
  } else {
    console.log('No asset deployment requests found to clear.');
  }

  console.log('Asset deployment data successfully cleared!');
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});

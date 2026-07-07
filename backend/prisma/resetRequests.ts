import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
  console.log('Resetting all request movements and statuses...');
  const prisma = new PrismaService();

  // 1. Delete all RequestEvents (movements)
  const deletedEvents = await prisma.requestEvent.deleteMany({});
  console.log(`Deleted ${deletedEvents.count} request events.`);

  // 2. Clear asset assignments from requests and reset status
  const updatedRequests = await prisma.request.updateMany({
    data: {
      status: 'PENDING_APPROVAL',
      assetId: null,
      releasedById: null,
      releasedAt: null,
      returnedById: null,
      returnedAt: null,
      approverId: null,
    },
  });
  console.log(`Reset ${updatedRequests.count} requests to PENDING_APPROVAL.`);

  // 3. Set all assets back to AVAILABLE and unassign them
  const updatedAssets = await prisma.asset.updateMany({
    where: {
      status: { not: 'AVAILABLE' },
    },
    data: {
      status: 'AVAILABLE',
      assignedToId: null,
    },
  });
  console.log(`Reset ${updatedAssets.count} assets to AVAILABLE.`);

  // 4. Optionally, clear AssetEvents
  const deletedAssetEvents = await prisma.assetEvent.deleteMany({
    where: {
      action: { in: ['CHECKED_OUT', 'RETURNED'] }
    }
  });
  console.log(`Deleted ${deletedAssetEvents.count} asset checkout/return events.`);

  console.log('Reset complete!');
  await prisma.onModuleDestroy();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

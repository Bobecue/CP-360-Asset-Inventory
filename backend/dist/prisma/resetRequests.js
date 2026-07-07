"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_service_1 = require("../src/prisma/prisma.service");
async function main() {
    console.log('Resetting all request movements and statuses...');
    const prisma = new prisma_service_1.PrismaService();
    const deletedEvents = await prisma.requestEvent.deleteMany({});
    console.log(`Deleted ${deletedEvents.count} request events.`);
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
//# sourceMappingURL=resetRequests.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_service_1 = require("./src/prisma/prisma.service");
async function main() {
    const prisma = new prisma_service_1.PrismaService();
    await prisma.onModuleInit();
    console.log('Deleting Request Events...');
    await prisma.requestEvent.deleteMany({});
    console.log('Deleting Asset Events (related to requests)...');
    await prisma.assetEvent.deleteMany({});
    console.log('Deleting Requests...');
    await prisma.request.deleteMany({});
    console.log('Resetting all Assets to AVAILABLE...');
    await prisma.asset.updateMany({
        data: {
            status: 'AVAILABLE',
            assignedToId: null,
        }
    });
    console.log('Successfully reset requests and asset statuses!');
    await prisma.onModuleDestroy();
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=reset-requests.js.map
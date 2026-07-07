"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_service_1 = require("../src/prisma/prisma.service");
async function main() {
    console.log('Deleting all requests and their events...');
    const prisma = new prisma_service_1.PrismaService();
    const deletedRequests = await prisma.request.deleteMany({});
    console.log(`Deleted ${deletedRequests.count} requests.`);
    console.log('Deletion complete!');
    await prisma.onModuleDestroy();
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=deleteAllRequests.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_service_1 = require("./prisma/prisma.service");
const prisma = new prisma_service_1.PrismaService();
async function main() {
    const pastPendingStatuses = ['READY_FOR_PICKUP', 'PENDING_PROCUREMENT', 'RELEASED', 'RETURNED'];
    const requests = await prisma.request.findMany({
        where: {
            status: {
                in: pastPendingStatuses
            }
        },
        include: {
            events: true
        }
    });
    let backfilledCount = 0;
    for (const req of requests) {
        const hasApprovedEvent = req.events.some((e) => e.status === 'APPROVED');
        if (!hasApprovedEvent) {
            const readyEvent = req.events.find((e) => e.status === 'READY_FOR_PICKUP' || e.status === 'PENDING_PROCUREMENT');
            const timestamp = readyEvent ? new Date(readyEvent.createdAt.getTime() - 1000) : new Date(req.createdAt.getTime() + 1000);
            await prisma.requestEvent.create({
                data: {
                    requestId: req.id,
                    status: 'APPROVED',
                    comment: 'Request approved (Backfilled)',
                    userId: req.approverId || null,
                    createdAt: timestamp
                }
            });
            backfilledCount++;
        }
    }
    console.log(`Backfilled APPROVED event for ${backfilledCount} requests.`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=backfill.js.map
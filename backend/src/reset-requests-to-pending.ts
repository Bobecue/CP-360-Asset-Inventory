import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'PROCUREMENT_DONE'`);
  } catch (err) {
    console.log('Enum type alter notice/handled:', err);
  }

  const requests = await prisma.request.findMany({
    where: {
      OR: [
        { purpose: null },
        { purpose: { not: { contains: '[ASSET DEPLOYMENT]' } } }
      ]
    },
    include: {
      requester: true
    }
  });

  console.log(`Updating ${requests.length} request orders with full timeline progression (PENDING_PROCUREMENT -> PROCUREMENT_DONE -> PENDING_APPROVAL)`);

  const now = new Date();
  const t1 = new Date(now.getTime() - 3600000); // 1 hour ago
  const t2 = new Date(now.getTime() - 1800000); // 30 mins ago
  const t3 = now;

  for (const req of requests) {
    // Delete existing events to cleanly insert full timeline
    await prisma.requestEvent.deleteMany({
      where: { requestId: req.id }
    });

    await prisma.request.update({
      where: { id: req.id },
      data: {
        status: 'PENDING_APPROVAL',
        comments: 'Request submitted and pending approval.',
        events: {
          createMany: {
            data: [
              {
                status: 'PENDING_PROCUREMENT',
                comment: 'No stock available at target site. Automatically routed to Pending Procurement.',
                userId: req.requesterId,
                createdAt: t1
              },
              {
                status: 'PROCUREMENT_DONE',
                comment: 'Stock levels adjusted and replenished. Procurement completed.',
                userId: req.requesterId,
                createdAt: t2
              },
              {
                status: 'PENDING_APPROVAL',
                comment: 'Submitted for Inventory Staff review',
                userId: req.requesterId,
                createdAt: t3
              }
            ]
          }
        }
      }
    });
  }

  console.log('Successfully updated all request orders with full 3-step timeline progression!');
}

main().catch(console.error).finally(() => {
  prisma.$disconnect();
  pool.end();
});

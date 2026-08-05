import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const requests = await prisma.request.findMany({
    include: {
      item: true,
      requester: true,
      events: true
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Total requests in DB: ${requests.length}`);
  requests.forEach(r => {
    console.log(`ID: ${r.id} | Status: ${r.status} | Item: ${r.item?.name} | User: ${r.requester?.name} | CreatedAt: ${r.createdAt} | EventsCount: ${r.events.length}`);
    r.events.forEach(e => console.log(`   Event: ${e.status} at ${e.createdAt} - ${e.comment}`));
  });
}

main().catch(console.error).finally(() => {
  prisma.$disconnect();
  pool.end();
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const req = await prisma.request.findUnique({
    where: { id: 'req-2d3fb07e' },
    include: {
      events: true,
      requester: true,
      opsApprovedBy: true,
      staffApprovedBy: true
    }
  });
  console.log(JSON.stringify(req, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

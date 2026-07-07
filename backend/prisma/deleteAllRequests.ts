import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
  console.log('Deleting all requests and their events...');
  const prisma = new PrismaService();

  // Due to cascade delete, deleting requests will also delete request events.
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

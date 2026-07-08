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
  const hash = '$2b$10$q7Jq5HiZdRkZ4lSqvtR4z.JOwjMZME.d8Q8ifcOYywevdb1.PkXn6'; // bcrypt hash of "SuperAdmin360!"
  const result = await prisma.user.updateMany({
    data: {
      passwordHash: hash
    }
  });
  console.log(`Successfully updated ${result.count} user accounts to use 'SuperAdmin360!' as their default password.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

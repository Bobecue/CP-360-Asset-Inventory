import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from 'bcryptjs';
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not defined");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users in database:`);
  for (const user of users) {
    const isMatch = await bcrypt.compare("SuperAdmin360!", user.passwordHash);
    console.log({
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash,
      isActive: user.isActive,
      role: user.role,
      isMatchSuperAdmin360: isMatch
    });
  }
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

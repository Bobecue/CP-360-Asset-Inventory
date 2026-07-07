import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcryptjs";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not defined");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const superAdminEmail = "superadmin@contactpoint360.com";
  const defaultPassword = "SuperAdmin360!";

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  // Upsert the Super Admin user
  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      passwordHash: passwordHash,
      name: "Super Admin",
      employeeId: "EID-0001",
      department: "Operations",
      role: Role.SUPER_ADMIN,
    },
    create: {
      email: superAdminEmail,
      passwordHash: passwordHash,
      name: "Super Admin",
      employeeId: "EID-0001",
      department: "Operations",
      role: Role.SUPER_ADMIN,
    },
  });

  console.log("-----------------------------------------");
  console.log("Seeding completed successfully!");
  console.log(`Default Super Admin User Created/Updated:`);
  console.log(`- Email: ${superAdmin.email}`);
  console.log(`- Name: ${superAdmin.name}`);
  console.log(`- Role: ${superAdmin.role}`);
  console.log(`- Temp Password: ${defaultPassword}`);
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error("Error during seeding process:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

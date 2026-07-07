"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const bcrypt = __importStar(require("bcryptjs"));
require("dotenv/config");
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not defined");
}
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log("Seeding database...");
    const superAdminEmail = "superadmin@contactpoint360.com";
    const defaultPassword = "SuperAdmin360!";
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);
    const superAdmin = await prisma.user.upsert({
        where: { email: superAdminEmail },
        update: {
            passwordHash: passwordHash,
            name: "Super Admin",
            employeeId: "EID-0001",
            department: "Operations",
            role: client_1.Role.SUPER_ADMIN,
        },
        create: {
            email: superAdminEmail,
            passwordHash: passwordHash,
            name: "Super Admin",
            employeeId: "EID-0001",
            department: "Operations",
            role: client_1.Role.SUPER_ADMIN,
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
//# sourceMappingURL=seed.js.map
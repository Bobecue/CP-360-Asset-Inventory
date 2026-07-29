import { PrismaClient, OpexUnit, OpexCategory, OpexStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding OPEX entries across 2 sample months (one locked, one open)...');

  const encoder = await prisma.user.findFirst({ where: { role: 'INVENTORY_STAFF' } }) 
    || await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });

  const approver = await prisma.user.findFirst({ where: { role: 'ADMIN' } }) 
    || await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });

  if (!encoder || !approver) {
    console.error('Users not found for seeding OPEX data.');
    return;
  }

  const supplier = await prisma.supplier.findFirst();
  const department = await prisma.department.findFirst();
  const site = await prisma.site.findFirst();

  // Month 1: Locked Month (2026-06)
  const juneClose = await prisma.monthlyClose.upsert({
    where: { yearMonth: '2026-06' },
    update: {},
    create: {
      year: 2026,
      month: 6,
      yearMonth: '2026-06',
      lockedByUserId: approver.id,
      summarySnapshot: {
        totalOpex: 12500.00,
        totalCapex: 45000.00,
        totalEntries: 2,
        byCategory: [
          { category: 'OFFICE_SUPPLIES', total: 12500.00 },
          { category: 'IT_PERIPHERALS', total: 45000.00 }
        ]
      }
    }
  });

  await prisma.opexEntry.createMany({
    skipDuplicates: true,
    data: [
      {
        itemDescription: 'June Ergonomic Office Chairs',
        unitPrice: 2500.00,
        qty: 5,
        unit: OpexUnit.PC,
        category: OpexCategory.OFFICE_SUPPLIES,
        total: 12500.00,
        status: OpexStatus.OK,
        sourceDocumentUrl: 'https://storage.contactpoint360.com/invoices/inv-2026-06-01.pdf',
        transactionDate: new Date('2026-06-15T10:00:00.000Z'),
        isCapex: false,
        supplierId: supplier?.id || null,
        departmentId: department?.id || null,
        siteId: site?.id || null,
        enteredByUserId: encoder.id,
        approvedByUserId: approver.id,
        monthlyCloseId: juneClose.id,
      },
      {
        itemDescription: 'June Server Rack Unit (CAPEX)',
        unitPrice: 45000.00,
        qty: 1,
        unit: OpexUnit.UNIT,
        category: OpexCategory.IT_PERIPHERALS,
        total: 45000.00,
        status: OpexStatus.OK,
        sourceDocumentUrl: 'https://storage.contactpoint360.com/invoices/inv-2026-06-02.pdf',
        transactionDate: new Date('2026-06-20T14:30:00.000Z'),
        isCapex: true,
        supplierId: supplier?.id || null,
        departmentId: department?.id || null,
        siteId: site?.id || null,
        enteredByUserId: encoder.id,
        approvedByUserId: approver.id,
        monthlyCloseId: juneClose.id,
      }
    ]
  });

  // Month 2: Open Month (2026-07)
  await prisma.opexEntry.createMany({
    skipDuplicates: true,
    data: [
      {
        itemDescription: 'Medical First Aid Kits & Nebulizers',
        unitPrice: 1200.00,
        qty: 4,
        unit: OpexUnit.SET,
        category: OpexCategory.MEDICAL_PHARMACY,
        total: 4800.00,
        status: OpexStatus.OK,
        sourceDocumentUrl: 'https://storage.contactpoint360.com/invoices/inv-2026-07-01.pdf',
        transactionDate: new Date('2026-07-05T09:15:00.000Z'),
        isCapex: false,
        supplierId: supplier?.id || null,
        departmentId: department?.id || null,
        siteId: site?.id || null,
        enteredByUserId: encoder.id,
        approvedByUserId: approver.id,
      },
      {
        itemDescription: 'Security Personnel Uniform Sets',
        unitPrice: 1800.00,
        qty: 10,
        unit: OpexUnit.SET,
        category: OpexCategory.SECURITY_UNIFORM,
        total: 18000.00,
        status: OpexStatus.PENDING,
        transactionDate: new Date('2026-07-12T11:00:00.000Z'),
        isCapex: false,
        supplierId: supplier?.id || null,
        departmentId: department?.id || null,
        siteId: site?.id || null,
        enteredByUserId: encoder.id,
      },
      {
        itemDescription: 'High-Capacity Network Switches (CAPEX)',
        unitPrice: 28000.00,
        qty: 2,
        unit: OpexUnit.UNIT,
        category: OpexCategory.IT_PERIPHERALS,
        total: 56000.00,
        status: OpexStatus.FOR_REVIEW,
        transactionDate: new Date('2026-07-22T16:00:00.000Z'),
        isCapex: true,
        supplierId: supplier?.id || null,
        departmentId: department?.id || null,
        siteId: site?.id || null,
        enteredByUserId: encoder.id,
      }
    ]
  });

  console.log('OPEX seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

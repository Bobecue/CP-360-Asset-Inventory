import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOpexEntryDto, UpdateOpexEntryDto, ApproveOpexEntryDto, LockMonthDto } from './dto/opex.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class OpexService {
  constructor(private prisma: PrismaService) {}

  private async resolveUser(userIdentifier?: string) {
    if (!userIdentifier) {
      return this.prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    }
    const found = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: userIdentifier },
          { id: userIdentifier }
        ]
      }
    });
    if (found) return found;
    return this.prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  }

  private getYearMonthStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  private async checkMonthNotLocked(transactionDate: Date) {
    const yearMonth = this.getYearMonthStr(transactionDate);
    const existingLock = await this.prisma.monthlyClose.findUnique({
      where: { yearMonth }
    });
    if (existingLock) {
      throw new BadRequestException(`Month ${yearMonth} is locked. Modifications are forbidden.`);
    }
  }

  // 1. Create entry (total computed server-side, unitPrice * qty)
  async create(dto: CreateOpexEntryDto, userIdentifier?: string) {
    const user = await this.resolveUser(userIdentifier);
    if (!user) throw new ForbiddenException('User not found.');

    const txDate = dto.transactionDate ? new Date(dto.transactionDate) : new Date();
    await this.checkMonthNotLocked(txDate);

    const unitPrice = new Prisma.Decimal(dto.unitPrice);
    const qty = new Prisma.Decimal(dto.qty);
    const total = unitPrice.mul(qty);

    return this.prisma.opexEntry.create({
      data: {
        itemDescription: dto.itemDescription,
        brand: dto.brand || null,
        unitPrice,
        qty,
        unit: dto.unit || 'PC',
        category: dto.category || 'OFFICE_SUPPLIES',
        total,
        status: 'PENDING',
        sourceDocumentUrl: dto.sourceDocumentUrl || null,
        transactionDate: txDate,
        isCapex: dto.isCapex || false,
        supplierId: dto.supplierId || null,
        supplierName: dto.supplierName || null,
        departmentId: dto.departmentId || null,
        destinationName: dto.destinationName || null,
        siteId: dto.siteId || user.siteId || null,
        enteredByUserId: user.id,
      },
      include: {
        supplier: true,
        department: true,
        site: true,
        enteredByUser: true,
        approvedByUser: true,
      }
    });
  }

  // Find all with query filters
  async findAll(query: { year?: number; month?: number; status?: string; isCapex?: boolean }) {
    const where: Prisma.OpexEntryWhereInput = {};

    if (query.status) {
      where.status = query.status as any;
    }
    if (query.isCapex !== undefined) {
      where.isCapex = query.isCapex;
    }
    if (query.year && query.month) {
      const startDate = new Date(query.year, query.month - 1, 1);
      const endDate = new Date(query.year, query.month, 0, 23, 59, 59, 999);
      where.transactionDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    return this.prisma.opexEntry.findMany({
      where,
      orderBy: { transactionDate: 'desc' },
      include: {
        supplier: true,
        department: true,
        site: true,
        enteredByUser: true,
        approvedByUser: true,
      }
    });
  }

  async findOne(id: string) {
    const entry = await this.prisma.opexEntry.findUnique({
      where: { id },
      include: {
        supplier: true,
        department: true,
        site: true,
        enteredByUser: true,
        approvedByUser: true,
        monthlyClose: true,
      }
    });
    if (!entry) throw new NotFoundException(`OPEX Entry #${id} not found.`);
    return entry;
  }

  // Update entry
  async update(id: string, dto: UpdateOpexEntryDto, userIdentifier?: string) {
    const entry = await this.findOne(id);
    await this.checkMonthNotLocked(entry.transactionDate);

    const user = await this.resolveUser(userIdentifier);

    const unitPrice = dto.unitPrice !== undefined ? new Prisma.Decimal(dto.unitPrice) : entry.unitPrice;
    const qty = dto.qty !== undefined ? new Prisma.Decimal(dto.qty) : entry.qty;
    const total = unitPrice.mul(qty);

    const txDate = dto.transactionDate ? new Date(dto.transactionDate) : entry.transactionDate;
    if (dto.transactionDate) {
      await this.checkMonthNotLocked(txDate);
    }

    return this.prisma.opexEntry.update({
      where: { id },
      data: {
        ...(dto.itemDescription && { itemDescription: dto.itemDescription }),
        ...(dto.brand !== undefined && { brand: dto.brand }),
        unitPrice,
        qty,
        total,
        ...(dto.unit && { unit: dto.unit }),
        ...(dto.category && { category: dto.category }),
        ...(dto.supplierId !== undefined && { supplierId: dto.supplierId }),
        ...(dto.supplierName !== undefined && { supplierName: dto.supplierName }),
        ...(dto.departmentId !== undefined && { departmentId: dto.departmentId }),
        ...(dto.destinationName !== undefined && { destinationName: dto.destinationName }),
        ...(dto.siteId !== undefined && { siteId: dto.siteId }),
        ...(dto.sourceDocumentUrl !== undefined && { sourceDocumentUrl: dto.sourceDocumentUrl }),
        ...(dto.transactionDate && { transactionDate: txDate }),
        ...(dto.isCapex !== undefined && { isCapex: dto.isCapex }),
      },
      include: {
        supplier: true,
        department: true,
        site: true,
        enteredByUser: true,
        approvedByUser: true,
      }
    });
  }

  // 2. Approve/Flag entry — segregation of duties: approver != encoder
  async approve(id: string, dto: ApproveOpexEntryDto, userIdentifier?: string) {
    const entry = await this.findOne(id);
    await this.checkMonthNotLocked(entry.transactionDate);

    const user = await this.resolveUser(userIdentifier);
    if (!user) throw new ForbiddenException('Approver user not found.');

    // Enforce segregation of duties
    if (entry.enteredByUserId === user.id) {
      throw new ForbiddenException('Segregation of Duties: You cannot approve/flag an OPEX entry that you created yourself.');
    }

    // Require sourceDocumentUrl if marking as OK
    const finalDocUrl = dto.sourceDocumentUrl || entry.sourceDocumentUrl;
    if (dto.status === 'OK' && !finalDocUrl) {
      throw new BadRequestException('Validation Error: A source document URL is required before marking an entry as OK.');
    }

    return this.prisma.opexEntry.update({
      where: { id },
      data: {
        status: dto.status,
        approvedByUserId: user.id,
        rejectionReason: dto.status === 'REJECTED' ? (dto.rejectionReason || 'Rejected by approver') : null,
        ...(dto.sourceDocumentUrl && { sourceDocumentUrl: dto.sourceDocumentUrl }),
      },
      include: {
        supplier: true,
        department: true,
        site: true,
        enteredByUser: true,
        approvedByUser: true,
      }
    });
  }

  // 3. Month-end lock & archive snapshot
  async lockMonth(dto: LockMonthDto, userIdentifier?: string) {
    const user = await this.resolveUser(userIdentifier);
    if (!user) throw new ForbiddenException('User not found.');

    const yearMonth = `${dto.year}-${String(dto.month).padStart(2, '0')}`;
    const existing = await this.prisma.monthlyClose.findUnique({ where: { yearMonth } });
    if (existing) {
      throw new BadRequestException(`Month ${yearMonth} is already locked.`);
    }

    const startDate = new Date(dto.year, dto.month - 1, 1);
    const endDate = new Date(dto.year, dto.month, 0, 23, 59, 59, 999);

    const entries = await this.prisma.opexEntry.findMany({
      where: {
        transactionDate: {
          gte: startDate,
          lte: endDate,
        }
      },
      include: {
        supplier: true,
        department: true,
        site: true,
        enteredByUser: true,
        approvedByUser: true,
      }
    });

    // Validations before locking
    const pendingEntries = entries.filter(e => e.status === 'PENDING');
    if (pendingEntries.length > 0) {
      throw new BadRequestException(`Cannot lock month ${yearMonth}: ${pendingEntries.length} entry/entries are still PENDING.`);
    }

    const okWithoutDoc = entries.filter(e => e.status === 'OK' && !e.sourceDocumentUrl);
    if (okWithoutDoc.length > 0) {
      throw new BadRequestException(`Cannot lock month ${yearMonth}: ${okWithoutDoc.length} OK entry/entries are missing source documents.`);
    }

    // Generate executive summary & rollups for snapshot
    const rollup = this.calculateRollupFromEntries(entries);
    
    // Get prior month rollup for MoM delta calculation
    const priorDate = new Date(dto.year, dto.month - 2, 1);
    const priorYearMonth = `${priorDate.getFullYear()}-${String(priorDate.getMonth() + 1).padStart(2, '0')}`;
    const priorClose = await this.prisma.monthlyClose.findUnique({ where: { yearMonth: priorYearMonth } });
    
    let momDelta = 0;
    let priorTotal = 0;
    if (priorClose && (priorClose.summarySnapshot as any)?.executiveSummary) {
      priorTotal = Number((priorClose.summarySnapshot as any).executiveSummary.totalOpex || 0);
      momDelta = rollup.totalOpex - priorTotal;
    }

    const summarySnapshot = {
      yearMonth,
      totalOpex: rollup.totalOpex,
      totalCapex: rollup.totalCapex,
      totalEntries: entries.length,
      okEntries: entries.filter(e => e.status === 'OK').length,
      forReviewEntries: entries.filter(e => e.status === 'FOR_REVIEW').length,
      rejectedEntries: entries.filter(e => e.status === 'REJECTED').length,
      priorMonthTotal: priorTotal,
      momDelta,
      momDeltaPct: priorTotal > 0 ? ((momDelta / priorTotal) * 100).toFixed(2) + '%' : 'N/A',
      byDestination: rollup.byDestination,
      bySupplier: rollup.bySupplier,
      byCategory: rollup.byCategory,
      entriesSnapshot: entries,
    };

    return this.prisma.$transaction(async (tx) => {
      const close = await tx.monthlyClose.create({
        data: {
          year: dto.year,
          month: dto.month,
          yearMonth,
          lockedByUserId: user.id,
          summarySnapshot: summarySnapshot as any,
        }
      });

      await tx.opexEntry.updateMany({
        where: {
          transactionDate: {
            gte: startDate,
            lte: endDate,
          }
        },
        data: {
          monthlyCloseId: close.id
        }
      });

      return close;
    });
  }

  // 4. Rollup / Report Generation
  async getRollupReport(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const entries = await this.prisma.opexEntry.findMany({
      where: {
        transactionDate: {
          gte: startDate,
          lte: endDate,
        }
      },
      include: {
        supplier: true,
        department: true,
        site: true,
      }
    });

    const rollup = this.calculateRollupFromEntries(entries);

    // Prior Month comparison
    const priorDate = new Date(year, month - 2, 1);
    const priorStartDate = new Date(priorDate.getFullYear(), priorDate.getMonth(), 1);
    const priorEndDate = new Date(priorDate.getFullYear(), priorDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const priorEntries = await this.prisma.opexEntry.findMany({
      where: {
        transactionDate: {
          gte: priorStartDate,
          lte: priorEndDate,
        }
      }
    });
    const priorRollup = this.calculateRollupFromEntries(priorEntries);

    const momDelta = rollup.totalOpex - priorRollup.totalOpex;
    const momDeltaPct = priorRollup.totalOpex > 0
      ? Number(((momDelta / priorRollup.totalOpex) * 100).toFixed(2))
      : 0;

    return {
      yearMonth: `${year}-${String(month).padStart(2, '0')}`,
      executiveSummary: {
        totalOpex: rollup.totalOpex,
        totalCapex: rollup.totalCapex,
        totalEntries: entries.length,
        priorMonthTotal: priorRollup.totalOpex,
        momDelta,
        momDeltaPct,
        topCategories: rollup.byCategory.slice(0, 3),
        topSuppliers: rollup.bySupplier.slice(0, 3),
      },
      byDestination: rollup.byDestination,
      bySupplier: rollup.bySupplier,
      byCategory: rollup.byCategory,
    };
  }

  // 5. Get Monthly Archives
  async getArchives() {
    return this.prisma.monthlyClose.findMany({
      orderBy: { yearMonth: 'desc' },
      include: {
        lockedByUser: true,
      }
    });
  }

  async getArchiveByYearMonth(yearMonth: string) {
    const archive = await this.prisma.monthlyClose.findUnique({
      where: { yearMonth },
      include: {
        lockedByUser: true,
        entries: {
          include: {
            supplier: true,
            department: true,
            site: true,
            enteredByUser: true,
            approvedByUser: true,
          }
        }
      }
    });
    if (!archive) throw new NotFoundException(`Archive for month ${yearMonth} not found.`);
    return archive;
  }

  // Helper rollup calculation
  private calculateRollupFromEntries(entries: any[]) {
    let totalOpex = 0;
    let totalCapex = 0;

    const destMap: Record<string, number> = {};
    const supplierMap: Record<string, number> = {};
    const categoryMap: Record<string, number> = {};

    for (const e of entries) {
      const amt = Number(e.total);
      if (e.isCapex) {
        totalCapex += amt;
      } else {
        totalOpex += amt;
      }

      const dest = e.department?.name || e.destinationName || e.site?.name || 'Unassigned';
      destMap[dest] = (destMap[dest] || 0) + amt;

      const supp = e.supplier?.name || e.supplierName || 'Unknown Supplier';
      supplierMap[supp] = (supplierMap[supp] || 0) + amt;

      const cat = e.category || 'MISCELLANEOUS';
      categoryMap[cat] = (categoryMap[cat] || 0) + amt;
    }

    const byDestination = Object.entries(destMap).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
    const bySupplier = Object.entries(supplierMap).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
    const byCategory = Object.entries(categoryMap).map(([name, total]) => ({ category: name, total })).sort((a, b) => b.total - a.total);

    return { totalOpex, totalCapex, byDestination, bySupplier, byCategory };
  }
}

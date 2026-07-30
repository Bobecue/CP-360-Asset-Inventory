import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateOpexEntryDto, UpdateOpexEntryDto, ApproveOpexEntryDto, LockMonthDto, UnlockMonthDto } from './dto/opex.dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { join, extname } from 'path';
import { OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import { generateTransactionsPdfBuffer, generateExecutiveSummaryPdfBuffer, generateArchivePdfBuffer } from './opex-pdf.exporter';

@Injectable()
export class OpexService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) { }

  async onModuleInit() {
    await this.migrateLegacySourceDocumentUrls();
  }

  // Migrate legacy sourceDocumentUrl text values into TransactionAttachment records
  async migrateLegacySourceDocumentUrls() {
    try {
      const entries = await this.prisma.opexEntry.findMany({
        where: {
          sourceDocumentUrl: { not: null },
          attachments: { none: {} },
        },
      });

      for (const entry of entries) {
        if (!entry.sourceDocumentUrl) continue;
        await this.prisma.transactionAttachment.create({
          data: {
            transactionId: entry.id,
            fileUrl: entry.sourceDocumentUrl,
            originalFilename: entry.sourceDocumentUrl.split('/').pop() || 'Legacy Document Link',
            mimeType: entry.sourceDocumentUrl.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
            fileSizeBytes: 0,
            uploadedByUserId: entry.enteredByUserId,
            isLegacyUrlOnly: true,
          },
        });
      }
    } catch (err) {
      console.error('Failed to migrate legacy sourceDocumentUrl entries:', err);
    }
  }

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

  // Role assertion guards
  private assertNotEmployee(user: any) {
    if (user.role === 'EMPLOYEE') {
      throw new ForbiddenException('Access Denied: Employees do not have access to the OPEX/CAPEX module.');
    }
  }

  private assertCanApprove(user: any) {
    this.assertNotEmployee(user);
    if (user.role === 'TEAM_LEADER') {
      throw new ForbiddenException('Forbidden: Team Leaders cannot approve or sign off on expense entries.');
    }
  }

  private assertCanLock(user: any) {
    this.assertNotEmployee(user);
    if (user.role === 'INVENTORY_STAFF' || user.role === 'TEAM_LEADER') {
      throw new ForbiddenException('Forbidden: Only Ops Managers and Super Admins can lock financial periods.');
    }
  }

  private assertCanViewReports(user: any) {
    this.assertNotEmployee(user);
    if (user.role === 'INVENTORY_STAFF' || user.role === 'TEAM_LEADER') {
      throw new ForbiddenException('Forbidden: Only Ops Managers and Super Admins can view executive financial rollups and reports.');
    }
  }

  private assertCanUnlock(user: any) {
    if (user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Forbidden: Only Super Admin can override or unlock closed financial periods.');
    }
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
    this.assertNotEmployee(user);

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
        attachments: {
          where: { isDeleted: false },
          include: { uploadedByUser: true },
        },
      }
    });
  }

  // Find all with query filters + offset pagination
  async findAll(query: {
    year?: number;
    month?: number;
    status?: string;
    isCapex?: boolean;
    siteId?: string;
    destinationName?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(200, Math.max(1, query.pageSize ?? 25));
    const skip = (page - 1) * pageSize;

    const where: Prisma.OpexEntryWhereInput = {
      isDeleted: false,
    };

    if (query.status) {
      where.status = query.status as any;
    }
    if (query.isCapex !== undefined) {
      where.isCapex = query.isCapex;
    }
    if (query.siteId || query.destinationName) {
      where.OR = [
        ...(query.siteId ? [{ siteId: query.siteId }] : []),
        ...(query.destinationName ? [{ destinationName: query.destinationName }] : []),
        ...(query.destinationName ? [{ site: { name: query.destinationName } }] : []),
      ];
    }
    if (query.year && query.month) {
      const startDate = new Date(query.year, query.month - 1, 1);
      const endDate = new Date(query.year, query.month, 0, 23, 59, 59, 999);
      where.transactionDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    const orderBy: Prisma.OpexEntryOrderByWithRelationInput[] = [
      { transactionDate: 'desc' },
      { id: 'desc' }, // stable secondary sort to prevent row duplication across pages
    ];

    const [total, data] = await Promise.all([
      this.prisma.opexEntry.count({ where }),
      this.prisma.opexEntry.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          supplier: true,
          department: true,
          site: true,
          enteredByUser: true,
          approvedByUser: true,
          attachments: {
            where: { isDeleted: false },
            include: { uploadedByUser: true },
          },
        },
      }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  // Fetch ALL entries for a filter set (used by CSV/PDF export — never paginated)
  async findAllForExport(query: {
    year?: number;
    month?: number;
    status?: string;
    isCapex?: boolean;
    siteId?: string;
    destinationName?: string;
  }) {
    const where: Prisma.OpexEntryWhereInput = { isDeleted: false };
    if (query.status) where.status = query.status as any;
    if (query.isCapex !== undefined) where.isCapex = query.isCapex;
    if (query.siteId || query.destinationName) {
      where.OR = [
        ...(query.siteId ? [{ siteId: query.siteId }] : []),
        ...(query.destinationName ? [{ destinationName: query.destinationName }] : []),
        ...(query.destinationName ? [{ site: { name: query.destinationName } }] : []),
      ];
    }
    if (query.year && query.month) {
      const startDate = new Date(query.year, query.month - 1, 1);
      const endDate = new Date(query.year, query.month, 0, 23, 59, 59, 999);
      where.transactionDate = { gte: startDate, lte: endDate };
    }
    return this.prisma.opexEntry.findMany({
      where,
      orderBy: [{ transactionDate: 'desc' }, { id: 'desc' }],
      include: {
        supplier: true,
        department: true,
        site: true,
        enteredByUser: true,
        approvedByUser: true,
        attachments: { where: { isDeleted: false }, include: { uploadedByUser: true } },
      },
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
        attachments: {
          where: { isDeleted: false },
          include: { uploadedByUser: true },
        },
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
        attachments: {
          where: { isDeleted: false },
          include: { uploadedByUser: true },
        },
      }
    });
  }

  // 2. Approve/Flag entry — segregation of duties: approver != encoder
  async approve(id: string, dto: ApproveOpexEntryDto, userIdentifier?: string) {
    const entry = await this.findOne(id);
    await this.checkMonthNotLocked(entry.transactionDate);

    const user = await this.resolveUser(userIdentifier);
    if (!user) throw new ForbiddenException('Approver user not found.');
    this.assertCanApprove(user);

    // Enforce segregation of duties
    if (entry.enteredByUserId === user.id || (entry.enteredByUser && entry.enteredByUser.name === user.name)) {
      throw new ForbiddenException('Segregation of Duties: You cannot approve or sign off on an expense entry created under your own user account.');
    }

    // Enforce attachment compliance gate for status OK
    if (dto.status === 'OK') {
      const activeAttachmentsCount = await this.prisma.transactionAttachment.count({
        where: { transactionId: id, isDeleted: false },
      });
      if (activeAttachmentsCount === 0 && !entry.sourceDocumentUrl) {
        throw new BadRequestException('Compliance Gate: An expense entry cannot be approved (status = OK) without at least one active source document attachment.');
      }
    }

    // Update entry status
    return this.prisma.opexEntry.update({
      where: { id },
      data: {
        status: dto.status,
        approvedByUserId: user.id,
        rejectionReason: dto.status === 'REJECTED' ? (dto.rejectionReason || 'Rejected by approver') : null,
        ...(dto.sourceDocumentUrl !== undefined && { sourceDocumentUrl: dto.sourceDocumentUrl }),
      },
      include: {
        supplier: true,
        department: true,
        site: true,
        enteredByUser: true,
        approvedByUser: true,
        attachments: {
          where: { isDeleted: false },
          include: { uploadedByUser: true },
        },
      }
    });
  }

  // 3. Month-end lock & archive snapshot
  async lockMonth(dto: LockMonthDto, userIdentifier?: string) {
    const user = await this.resolveUser(userIdentifier);
    if (!user) throw new ForbiddenException('User not found.');
    this.assertCanLock(user);

    if (!dto.password || !dto.password.trim()) {
      throw new BadRequestException('Account password is required to lock a financial period.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid account password. Authorization failed.');
    }

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

  // 3b. Month unlock / override (Super Admin only)
  async unlockMonth(dto: UnlockMonthDto, userIdentifier?: string) {
    const user = await this.resolveUser(userIdentifier);
    if (!user) throw new ForbiddenException('User not found.');
    this.assertCanUnlock(user);

    if (!dto.password || !dto.password.trim()) {
      throw new BadRequestException('Account password is required to unlock a closed financial period.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid account password. Authorization failed.');
    }

    if (!dto.reason || !dto.reason.trim()) {
      throw new BadRequestException('An explicit justification reason is required to unlock a closed period.');
    }

    const yearMonth = `${dto.year}-${String(dto.month).padStart(2, '0')}`;
    const existing = await this.prisma.monthlyClose.findUnique({ where: { yearMonth } });
    if (!existing) {
      throw new NotFoundException(`Month ${yearMonth} is not locked.`);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.opexEntry.updateMany({
        where: { monthlyCloseId: existing.id },
        data: { monthlyCloseId: null },
      });

      await tx.monthlyClose.delete({
        where: { id: existing.id },
      });

      await tx.auditLog.create({
        data: {
          action: 'OPEX_MONTH_UNLOCK_OVERRIDE',
          details: `Super Admin ${user.name} (${user.email}) unlocked closed financial period ${yearMonth}. Reason: ${dto.reason}`,
          userId: user.id,
        },
      });

      return { message: `Financial period ${yearMonth} unlocked successfully.`, yearMonth };
    });
  }

  // 4. Rollup / Report Generation
  async getRollupReport(year: number, month: number, userIdentifier?: string, siteId?: string, destinationName?: string) {
    const user = await this.resolveUser(userIdentifier);
    if (!user) throw new ForbiddenException('User not found.');
    this.assertCanViewReports(user);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const siteWhere: Prisma.OpexEntryWhereInput = {};
    if (siteId || destinationName) {
      siteWhere.OR = [
        ...(siteId ? [{ siteId }] : []),
        ...(destinationName ? [{ destinationName }] : []),
        ...(destinationName ? [{ site: { name: destinationName } }] : []),
      ];
    }

    const entries = await this.prisma.opexEntry.findMany({
      where: {
        ...siteWhere,
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
        ...siteWhere,
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

  // Helper rollup calculation — strictly counts approved/OK transactions
  private calculateRollupFromEntries(entries: any[]) {
    let totalOpex = 0;
    let totalCapex = 0;

    const destMap: Record<string, number> = {};
    const supplierMap: Record<string, number> = {};
    const categoryMap: Record<string, number> = {};

    // Only include transactions that are approved / status === 'OK'
    const approvedEntries = entries.filter(e => e.status === 'OK');

    for (const e of approvedEntries) {
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

  // Upload document attachment file (PDF, JPG, PNG, HEIC)
  async uploadAttachment(transactionId: string, file: any, userIdentifier?: string) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    const entry = await this.findOne(transactionId);
    await this.checkMonthNotLocked(entry.transactionDate);

    const user = await this.resolveUser(userIdentifier);
    if (!user) throw new ForbiddenException('User not found.');

    // Validate file type (PDF, JPG, PNG, HEIC)
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.heic'];
    const ext = extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new BadRequestException(`Invalid file type (${ext}). Only PDF, JPG, PNG, and HEIC files are accepted.`);
    }

    // Max 10MB check
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds the maximum limit of 10MB.');
    }

    // Save file on local disk
    const relativeDir = join('uploads', 'attachments', transactionId);
    const absoluteDir = join(process.cwd(), relativeDir);
    if (!fs.existsSync(absoluteDir)) {
      fs.mkdirSync(absoluteDir, { recursive: true });
    }

    const filename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const absolutePath = join(absoluteDir, filename);
    fs.writeFileSync(absolutePath, file.buffer);

    const hostUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    
    // Create record with dynamic stream URL
    const attachment = await this.prisma.transactionAttachment.create({
      data: {
        transactionId,
        fileUrl: `${hostUrl}/opex/attachments/temp/file`,
        originalFilename: file.originalname,
        mimeType: file.mimetype || 'application/octet-stream',
        fileSizeBytes: file.size || 0,
        uploadedByUserId: user.id,
      },
      include: {
        uploadedByUser: true,
      },
    });

    const fileUrl = `${hostUrl}/opex/attachments/${attachment.id}/file`;
    const updatedAttachment = await this.prisma.transactionAttachment.update({
      where: { id: attachment.id },
      data: { fileUrl },
      include: { uploadedByUser: true },
    });

    // Write ATTACHMENT_ADDED audit log entry
    await this.prisma.transactionAuditLog.create({
      data: {
        transactionId,
        action: 'ATTACHMENT_ADDED',
        performedByUserId: user.id,
        performedByRole: user.role || 'INVENTORY_STAFF',
        newValue: file.originalname,
      },
    });

    return updatedAttachment;
  }

  // Get authenticated attachment file stream from disk with role access enforcement
  async getAttachmentFile(attachmentId: string, userIdentifier?: string) {
    const user = await this.resolveUser(userIdentifier);
    if (!user) throw new ForbiddenException('User not authenticated.');

    // 1. Employee role fully blocked
    this.assertNotEmployee(user);

    const attachment = await this.prisma.transactionAttachment.findUnique({
      where: { id: attachmentId },
      include: { transaction: true },
    });

    if (!attachment || attachment.isDeleted) {
      throw new NotFoundException(`Attachment #${attachmentId} not found.`);
    }

    // 2. Team Leader limited to entries created under their account or uploaded by them
    if (user.role === 'TEAM_LEADER') {
      if (attachment.transaction.enteredByUserId !== user.id && attachment.uploadedByUserId !== user.id) {
        throw new ForbiddenException('Access Denied: Team Leaders can only view attachments for expense entries created or uploaded by their account.');
      }
    }

    const relativeDir = join('uploads', 'attachments', attachment.transactionId);
    const absoluteDir = join(process.cwd(), relativeDir);
    
    // Find matching file on disk
    if (!fs.existsSync(absoluteDir)) {
      throw new NotFoundException('Attachment directory not found on disk.');
    }

    const files = fs.readdirSync(absoluteDir);
    const matchingFile = files.find(f => f.includes(attachment.originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_')));
    const absolutePath = matchingFile ? join(absoluteDir, matchingFile) : join(absoluteDir, files[0]);

    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundException('Attachment file not found on disk.');
    }

    return { attachment, absolutePath };
  }

  // Remove document attachment (soft delete)
  async removeAttachment(transactionId: string, attachmentId: string, reason?: string, userIdentifier?: string) {
    const entry = await this.findOne(transactionId);
    await this.checkMonthNotLocked(entry.transactionDate);

    const user = await this.resolveUser(userIdentifier);
    if (!user) throw new ForbiddenException('User not found.');

    const attachment = await this.prisma.transactionAttachment.findUnique({
      where: { id: attachmentId },
    });
    if (!attachment || attachment.transactionId !== transactionId) {
      throw new NotFoundException(`Attachment #${attachmentId} not found.`);
    }

    // Deleting an attachment on an approved entry requires a justification reason
    if (entry.status === 'OK' && (!reason || !reason.trim())) {
      throw new BadRequestException('A justification reason is required to remove an attachment from an approved expense entry.');
    }

    const updated = await this.prisma.transactionAttachment.update({
      where: { id: attachmentId },
      data: { isDeleted: true },
    });

    // Write ATTACHMENT_REMOVED audit log entry
    await this.prisma.transactionAuditLog.create({
      data: {
        transactionId,
        action: 'ATTACHMENT_REMOVED',
        performedByUserId: user.id,
        performedByRole: user.role || 'INVENTORY_STAFF',
        previousValue: attachment.originalFilename,
        reason: reason || null,
      },
    });

    return updated;
  }

  async remove(id: string) {
    return this.prisma.opexEntry.delete({ where: { id } });
  }

  async removeAll() {
    return this.prisma.opexEntry.deleteMany({});
  }

  // --- Export Methods ---

  async exportTransactionsCSV(query: any, userIdentifier?: string) {
    const user = await this.resolveUser(userIdentifier);
    if (!user) throw new ForbiddenException('User not found.');
    this.assertNotEmployee(user);

    let entries = await this.findAllForExport(query);

    if (query.search && query.search.trim()) {
      const q = query.search.toLowerCase().trim();
      entries = entries.filter((e: any) =>
        (e.itemDescription || '').toLowerCase().includes(q) ||
        (e.category || '').toLowerCase().includes(q) ||
        (e.supplierName || e.supplier?.name || '').toLowerCase().includes(q) ||
        (e.destinationName || e.site?.name || '').toLowerCase().includes(q) ||
        (e.status || '').toLowerCase().includes(q)
      );
    }

    const filterSummary = `Year=${query.year || 'ALL'}, Month=${query.month || 'ALL'}, Status=${query.status || 'ALL'}, Type=${query.isCapex !== undefined ? (query.isCapex ? 'CAPEX' : 'OPEX') : 'ALL'}, Site=${query.destinationName || query.siteId || 'ALL'}, Search="${query.search || 'None'}"`;

    await this.auditLogsService.create({
      action: 'EXPORT_TRANSACTIONS_CSV',
      details: `Exported ${entries.length} records. Scope: ${filterSummary}`,
      userId: user.id,
    });

    const csvHeaders = [
      'Date',
      'Description',
      'Category',
      'Type',
      'Location',
      'Supplier',
      'Qty',
      'Unit Price (PHP)',
      'Total (PHP)',
      'Status',
      'Reviewed By',
      'Attachment Count',
    ];

    const lines = [
      `# ContactPoint 360 - Transaction Tracker Export`,
      `# Filter Criteria: ${filterSummary}`,
      `# Exported By: ${user.name || user.email} (${user.role})`,
      `# Exported At: ${new Date().toLocaleString()}`,
      csvHeaders.map(h => `"${h}"`).join(','),
    ];

    entries.forEach((item: any) => {
      const row = [
        `"${item.transactionDate ? new Date(item.transactionDate).toLocaleDateString() : ''}"`,
        `"${(item.itemDescription || '').replace(/"/g, '""')}"`,
        `"${(item.category || '').replace(/"/g, '""')}"`,
        item.isCapex ? 'CAPEX' : 'OPEX',
        `"${(item.destinationName || item.site?.name || 'N/A').replace(/"/g, '""')}"`,
        `"${(item.supplierName || item.supplier?.name || 'Unassigned').replace(/"/g, '""')}"`,
        `${Number(item.qty || 0)} ${item.unit || 'PC'}`,
        Number(item.unitPrice || 0).toFixed(2),
        Number(item.total || 0).toFixed(2),
        item.status || 'PENDING',
        `"${(item.approvedByUser?.name || item.approvedByUser?.email || 'N/A').replace(/"/g, '""')}"`,
        Array.isArray(item.attachments) ? item.attachments.length : (item.sourceDocumentUrl ? 1 : 0),
      ];
      lines.push(row.join(','));
    });

    return {
      csvContent: lines.join('\n'),
      filename: `Transactions_Export_${new Date().toISOString().split('T')[0]}.csv`,
    };
  }

  async exportTransactionsPdf(query: any, userIdentifier?: string) {
    const user = await this.resolveUser(userIdentifier);
    if (!user) throw new ForbiddenException('User not found.');
    this.assertNotEmployee(user);

    let entries = await this.findAllForExport(query);

    if (query.search && query.search.trim()) {
      const q = query.search.toLowerCase().trim();
      entries = entries.filter((e: any) =>
        (e.itemDescription || '').toLowerCase().includes(q) ||
        (e.category || '').toLowerCase().includes(q) ||
        (e.supplierName || e.supplier?.name || '').toLowerCase().includes(q) ||
        (e.destinationName || e.site?.name || '').toLowerCase().includes(q) ||
        (e.status || '').toLowerCase().includes(q)
      );
    }

    const filterSummary = `Year=${query.year || 'ALL'}, Month=${query.month || 'ALL'}, Status=${query.status || 'ALL'}, Type=${query.isCapex !== undefined ? (query.isCapex ? 'CAPEX' : 'OPEX') : 'ALL'}, Site=${query.destinationName || query.siteId || 'ALL'}, Search="${query.search || 'None'}"`;

    await this.auditLogsService.create({
      action: 'EXPORT_TRANSACTIONS_PDF',
      details: `Exported ${entries.length} records. Scope: ${filterSummary}`,
      userId: user.id,
    });

    const pdfBuffer = await generateTransactionsPdfBuffer({
      title: 'Transaction Tracker Report',
      filterSummary,
      generatedBy: `${user.name || user.email} (${user.role})`,
      generatedAt: new Date().toLocaleString(),
      entries,
    });

    return {
      pdfBuffer,
      filename: `Transaction_Tracker_Report_${new Date().toISOString().split('T')[0]}.pdf`,
    };
  }

  async exportExecutiveSummaryPdf(query: any, userIdentifier?: string) {
    const user = await this.resolveUser(userIdentifier);
    if (!user) throw new ForbiddenException('User not found.');
    this.assertCanViewReports(user);

    const now = new Date();
    const year = query.year ? parseInt(query.year, 10) : now.getFullYear();
    const month = query.month ? parseInt(query.month, 10) : now.getMonth() + 1;

    const reportData = await this.getRollupReport(year, month, userIdentifier, query.siteId, query.destinationName);

    await this.auditLogsService.create({
      action: 'EXPORT_EXECUTIVE_SUMMARY_PDF',
      details: `Exported executive summary for ${year}-${String(month).padStart(2, '0')}`,
      userId: user.id,
    });

    const pdfBuffer = await generateExecutiveSummaryPdfBuffer({
      year,
      month,
      generatedBy: `${user.name || user.email} (${user.role})`,
      generatedAt: new Date().toLocaleString(),
      reportData,
    });

    return {
      pdfBuffer,
      filename: `Executive_Summary_${year}_${String(month).padStart(2, '0')}.pdf`,
    };
  }

  async exportArchivePdf(yearMonth: string, userIdentifier?: string) {
    const user = await this.resolveUser(userIdentifier);
    if (!user) throw new ForbiddenException('User not found.');

    const archive = await this.getArchiveByYearMonth(yearMonth);
    if (!archive) throw new NotFoundException(`Archive for period ${yearMonth} not found.`);

    const reopenLogs = await this.prisma.auditLog.findMany({
      where: {
        action: { in: ['UNLOCK_MONTH', 'LOCK_MONTH'] },
        details: { contains: yearMonth },
      },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });

    await this.auditLogsService.create({
      action: 'EXPORT_LOCKED_ARCHIVE_PDF',
      details: `Exported historical locked archive snapshot for period ${yearMonth}`,
      userId: user.id,
    });

    const pdfBuffer = await generateArchivePdfBuffer({
      yearMonth,
      generatedBy: `${user.name || user.email} (${user.role})`,
      generatedAt: new Date().toLocaleString(),
      archive,
      reopenLogs,
    });

    return {
      pdfBuffer,
      filename: `Locked_Archive_${yearMonth}.pdf`,
    };
  }
}


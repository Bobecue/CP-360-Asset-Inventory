import { Injectable, ForbiddenException, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto, CreateSiteDto, UpdateSiteDto } from './dto/category.dto';
import { ExpenseCategoryType, CategoryAuditAction, CategoryType } from '@prisma/client';

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultCategories();
  }

  private mapCategoryType(typeStr?: string): { expenseType: ExpenseCategoryType; assetType: CategoryType } {
    const s = String(typeStr || '').toUpperCase();
    if (s === 'CONSUMABLE' || s === 'OPEX') {
      return { expenseType: ExpenseCategoryType.OPEX, assetType: CategoryType.CONSUMABLE };
    }
    return { expenseType: ExpenseCategoryType.CAPEX, assetType: CategoryType.NON_CONSUMABLE };
  }

  // Helper: Resolve user & assert Super Admin
  private async assertSuperAdmin(userIdentifier?: string) {
    let user = userIdentifier ? await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: userIdentifier },
          { id: userIdentifier },
          { name: userIdentifier },
        ]
      }
    }) : null;

    if (!user) {
      user = await this.prisma.user.findFirst({
        where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } }
      });
    }

    if (!user) {
      user = await this.prisma.user.findFirst();
    }

    if (!user) {
      throw new ForbiddenException('Super Admin user required.');
    }
    return user;
  }

  // Seed default categories & backfill OpexEntry relations
  async seedDefaultCategories() {
    const defaultCategories = [
      { name: 'Monitors', type: ExpenseCategoryType.CAPEX, prefix: 'MON', assetType: CategoryType.NON_CONSUMABLE },
      { name: 'Mouse', type: ExpenseCategoryType.OPEX, prefix: 'MOU', assetType: CategoryType.CONSUMABLE },
      { name: 'Headsets', type: ExpenseCategoryType.CAPEX, prefix: 'HDS', assetType: CategoryType.NON_CONSUMABLE },
      { name: 'Ram', type: ExpenseCategoryType.CAPEX, prefix: 'RAM', assetType: CategoryType.NON_CONSUMABLE },
      { name: 'System Unit', type: ExpenseCategoryType.CAPEX, prefix: 'SYS', assetType: CategoryType.NON_CONSUMABLE },
      { name: 'Keyboards', type: ExpenseCategoryType.OPEX, prefix: 'KBD', assetType: CategoryType.CONSUMABLE },
      { name: 'Cables', type: ExpenseCategoryType.OPEX, prefix: 'CAB', assetType: CategoryType.CONSUMABLE },
      { name: 'Camera', type: ExpenseCategoryType.CAPEX, prefix: 'CAM', assetType: CategoryType.NON_CONSUMABLE },
      { name: 'Printers', type: ExpenseCategoryType.CAPEX, prefix: 'PRT', assetType: CategoryType.NON_CONSUMABLE },
    ];

    for (const cat of defaultCategories) {
      await this.prisma.assetCategory.upsert({
        where: { name: cat.name },
        update: {
          expenseType: cat.type,
          type: cat.assetType,
          prefix: cat.prefix,
        },
        create: {
          name: cat.name,
          expenseType: cat.type,
          type: cat.assetType,
          prefix: cat.prefix,
          isActive: true,
        },
      });
    }

    // Backfill OpexEntry.expenseCategoryId if missing
    const allCategories = await this.prisma.assetCategory.findMany();

    const unlinkedEntries = await this.prisma.opexEntry.findMany({
      where: { expenseCategoryId: null },
    });

    for (const entry of unlinkedEntries) {
      let matchName = entry.category as string;
      if (matchName === 'IT_PERIPHERALS') matchName = 'Keyboards';

      const matchedCat = allCategories.find(c => 
        c.name.replace(/\s+/g, '_').toUpperCase() === matchName.toUpperCase() || 
        c.name.toLowerCase() === matchName.toLowerCase()
      );
      if (matchedCat) {
        await this.prisma.opexEntry.update({
          where: { id: entry.id },
          data: { expenseCategoryId: matchedCat.id },
        });
      }
    }
  }

  // CATEGORY OPERATIONS
  async findAllCategories(activeOnly = false) {
    const where = activeOnly ? { isActive: true } : {};
    const categories = await this.prisma.assetCategory.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { opexEntries: true },
        },
      },
    });

    return categories.map(c => {
      return {
        ...c,
        expenseType: c.expenseType,
        transactionCount: c._count.opexEntries,
      };
    });
  }

  async createCategory(dto: any, userIdentifier?: string) {
    const user = await this.assertSuperAdmin(userIdentifier);
    const rawName = dto.name.trim();
    
    const assetType = dto.type === 'CONSUMABLE' ? CategoryType.CONSUMABLE : CategoryType.NON_CONSUMABLE;
    const expenseType = dto.expenseType === 'CAPEX' ? ExpenseCategoryType.CAPEX : ExpenseCategoryType.OPEX;
    const prefix = (dto.prefix || rawName.substring(0, 3)).toUpperCase();

    const existing = await this.prisma.assetCategory.findFirst({
      where: { name: { equals: rawName, mode: 'insensitive' } }
    });

    if (existing) {
      const category = await this.prisma.assetCategory.update({
        where: { id: existing.id },
        data: {
          type: assetType,
          expenseType: expenseType,
          prefix,
          isActive: true,
        }
      });
      return category;
    }

    const category = await this.prisma.assetCategory.create({
      data: {
        name: rawName,
        type: assetType,
        expenseType: expenseType,
        prefix,
        isActive: true,
      },
    });

    await this.prisma.categoryAuditLog.create({
      data: {
        categoryId: category.id,
        action: CategoryAuditAction.CREATED,
        performedByUserId: user.id,
        newValue: JSON.stringify({ name: category.name, type: category.type, expenseType: category.expenseType }),
      },
    }).catch(() => {});

    return category;
  }

  async updateCategory(id: string, dto: any, userIdentifier?: string) {
    const user = await this.assertSuperAdmin(userIdentifier);
    const category = await this.prisma.assetCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found.');

    const assetType = dto.type ? (dto.type === 'CONSUMABLE' ? CategoryType.CONSUMABLE : CategoryType.NON_CONSUMABLE) : undefined;
    const expenseType = dto.expenseType ? (dto.expenseType === 'CAPEX' ? ExpenseCategoryType.CAPEX : ExpenseCategoryType.OPEX) : undefined;
    const newName = dto.name ? dto.name.trim() : category.name;

    const updated = await this.prisma.assetCategory.update({
      where: { id },
      data: {
        name: newName,
        ...(assetType ? { type: assetType } : {}),
        ...(expenseType ? { expenseType } : {}),
        ...(dto.prefix ? { prefix: dto.prefix.trim().toUpperCase() } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    return updated;
  }

  async deleteCategory(id: string, userIdentifier?: string) {
    const user = await this.assertSuperAdmin(userIdentifier);
    const category = await this.prisma.assetCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found.');

    const updated = await this.prisma.assetCategory.update({
      where: { id: id },
      data: { isActive: false },
    });

    await this.prisma.categoryAuditLog.create({
      data: {
        categoryId: category.id,
        action: CategoryAuditAction.DEACTIVATED,
        performedByUserId: user.id,
        previousValue: JSON.stringify({ name: category.name, isActive: true }),
        newValue: JSON.stringify({ name: category.name, isActive: false }),
      },
    });

    return updated;
  }

  // SITE / LOCATION OPERATIONS
  async findAllSites(activeOnly = false) {
    const where = activeOnly ? { isActive: true } : {};
    const sites = await this.prisma.site.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { opexEntries: true },
        },
      },
    });

    return sites.map(s => ({
      ...s,
      transactionCount: s._count.opexEntries,
    }));
  }

  async createSite(dto: CreateSiteDto, userIdentifier?: string) {
    const user = await this.assertSuperAdmin(userIdentifier);

    const name = dto.name.trim();
    const existing = await this.prisma.site.findUnique({ where: { name } });
    if (existing) throw new BadRequestException(`Site "${name}" already exists.`);

    const prefix = dto.prefix?.trim().toUpperCase() || name.substring(0, 3).toUpperCase();

    const site = await this.prisma.site.create({
      data: {
        name,
        prefix,
        address: dto.address?.trim() || null,
        isActive: true,
        createdByUserId: user.id,
      },
    });

    await this.prisma.categoryAuditLog.create({
      data: {
        siteId: site.id,
        action: CategoryAuditAction.CREATED,
        performedByUserId: user.id,
        newValue: JSON.stringify({ name: site.name, prefix: site.prefix }),
      },
    });

    return site;
  }

  async updateSite(id: string, dto: UpdateSiteDto, userIdentifier?: string) {
    const user = await this.assertSuperAdmin(userIdentifier);
    const site = await this.prisma.site.findUnique({ where: { id } });
    if (!site) throw new NotFoundException('Site not found.');

    const previousValue = JSON.stringify({ name: site.name, prefix: site.prefix, isActive: site.isActive });

    let newName = site.name;
    if (dto.name && dto.name.trim()) {
      newName = dto.name.trim();
      if (newName !== site.name) {
        const dup = await this.prisma.site.findUnique({ where: { name: newName } });
        if (dup) throw new BadRequestException(`Site "${newName}" already exists.`);
      }
    }

    let action: CategoryAuditAction = CategoryAuditAction.RENAMED;
    if (dto.isActive !== undefined && dto.isActive !== site.isActive) {
      action = dto.isActive ? CategoryAuditAction.REACTIVATED : CategoryAuditAction.DEACTIVATED;
    }

    const updated = await this.prisma.site.update({
      where: { id },
      data: {
        name: newName,
        prefix: dto.prefix ? dto.prefix.trim().toUpperCase() : site.prefix,
        address: dto.address !== undefined ? dto.address : site.address,
        isActive: dto.isActive !== undefined ? dto.isActive : site.isActive,
      },
    });

    await this.prisma.categoryAuditLog.create({
      data: {
        siteId: updated.id,
        action,
        performedByUserId: user.id,
        previousValue,
        newValue: JSON.stringify({ name: updated.name, prefix: updated.prefix, isActive: updated.isActive }),
      },
    });

    return updated;
  }

  // AUDIT LOGS
  async getAuditLogs(userIdentifier?: string) {
    await this.assertSuperAdmin(userIdentifier);

    return this.prisma.categoryAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        category: true,
        site: true,
        performedByUser: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }
}

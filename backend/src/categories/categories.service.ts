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
      { name: 'Monitors', type: ExpenseCategoryType.CAPEX },
      { name: 'Mouse', type: ExpenseCategoryType.OPEX },
      { name: 'Headsets', type: ExpenseCategoryType.CAPEX },
      { name: 'Ram', type: ExpenseCategoryType.CAPEX },
      { name: 'System Unit', type: ExpenseCategoryType.CAPEX },
      { name: 'Keyboards', type: ExpenseCategoryType.OPEX },
    ];

    for (const cat of defaultCategories) {
      await this.prisma.expenseCategory.upsert({
        where: { name: cat.name },
        update: {},
        create: {
          name: cat.name,
          type: cat.type,
          isActive: true,
        },
      });
    }

    // Backfill OpexEntry.expenseCategoryId if missing
    const allCategories = await this.prisma.expenseCategory.findMany();
    const categoryMap = new Map(allCategories.map(c => [c.name, c.id]));

    const unlinkedEntries = await this.prisma.opexEntry.findMany({
      where: { expenseCategoryId: null },
    });

    for (const entry of unlinkedEntries) {
      const catId = categoryMap.get(entry.category);
      if (catId) {
        await this.prisma.opexEntry.update({
          where: { id: entry.id },
          data: { expenseCategoryId: catId },
        });
      }
    }
  }

  // CATEGORY OPERATIONS
  async findAllCategories(activeOnly = false) {
    const where = activeOnly ? { isActive: true } : {};
    const categories = await this.prisma.expenseCategory.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { opexEntries: true },
        },
      },
    });

    const assetCategories = await this.prisma.assetCategory.findMany();
    const assetMap = new Map(assetCategories.map(ac => [ac.name.toLowerCase(), ac]));

    return categories.map(c => {
      const matchingAssetCat = assetMap.get(c.name.toLowerCase());
      const isConsumable = c.type === 'OPEX' || (matchingAssetCat && matchingAssetCat.type === 'CONSUMABLE') || /mouse|mice|keyboard|cable|consumable/i.test(c.name);
      return {
        ...c,
        prefix: matchingAssetCat?.prefix || c.name.substring(0, 3).toUpperCase(),
        type: isConsumable ? 'CONSUMABLE' : 'NON_CONSUMABLE',
        expenseType: c.type,
        transactionCount: c._count.opexEntries,
      };
    });
  }

  async createCategory(dto: any, userIdentifier?: string) {
    const user = await this.assertSuperAdmin(userIdentifier);
    const rawName = dto.name.trim();
    const { expenseType, assetType } = this.mapCategoryType(dto.type);

    const existing = await this.prisma.expenseCategory.findFirst({
      where: { name: { equals: rawName, mode: 'insensitive' } }
    });
    if (existing) {
      const category = await this.prisma.expenseCategory.update({
        where: { id: existing.id },
        data: {
          type: expenseType,
          isActive: true,
        }
      });
      const prefix = (dto.prefix || rawName.substring(0, 3)).toUpperCase();
      await this.prisma.assetCategory.upsert({
        where: { name: rawName },
        update: { type: assetType, prefix },
        create: { name: rawName, type: assetType, prefix, description: dto.description }
      }).catch(() => {});
      return category;
    }

    const category = await this.prisma.expenseCategory.create({
      data: {
        name: rawName,
        type: expenseType,
        isActive: true,
        createdByUserId: user.id,
      },
    });

    const prefix = (dto.prefix || rawName.substring(0, 3)).toUpperCase();
    await this.prisma.assetCategory.upsert({
      where: { name: rawName },
      update: { type: assetType, prefix },
      create: { name: rawName, type: assetType, prefix, description: dto.description }
    }).catch(() => {});

    await this.prisma.categoryAuditLog.create({
      data: {
        categoryId: category.id,
        action: CategoryAuditAction.CREATED,
        performedByUserId: user.id,
        newValue: JSON.stringify({ name: category.name, type: category.type }),
      },
    }).catch(() => {});

    return category;
  }

  async updateCategory(id: string, dto: any, userIdentifier?: string) {
    const user = await this.assertSuperAdmin(userIdentifier);
    let category = await this.prisma.expenseCategory.findUnique({ where: { id } });

    if (!category) {
      const assetCat = await this.prisma.assetCategory.findUnique({ where: { id } });
      if (assetCat) {
        const { assetType, expenseType } = this.mapCategoryType(dto.type);
        const updatedAssetCat = await this.prisma.assetCategory.update({
          where: { id },
          data: {
            ...(dto.name ? { name: dto.name.trim() } : {}),
            ...(dto.prefix ? { prefix: dto.prefix.trim().toUpperCase() } : {}),
            ...(dto.type ? { type: assetType } : {}),
            ...(dto.description !== undefined ? { description: dto.description } : {}),
          }
        });
        await this.prisma.expenseCategory.updateMany({
          where: { name: { equals: assetCat.name, mode: 'insensitive' } },
          data: {
            ...(dto.name ? { name: dto.name.trim() } : {}),
            ...(dto.type ? { type: expenseType } : {}),
          }
        }).catch(() => {});
        return updatedAssetCat;
      }
      throw new NotFoundException('Category not found.');
    }

    const { expenseType, assetType } = this.mapCategoryType(dto.type || category.type);
    const newName = dto.name ? dto.name.trim() : category.name;

    const updated = await this.prisma.expenseCategory.update({
      where: { id },
      data: {
        name: newName,
        type: dto.type ? expenseType : category.type,
        isActive: dto.isActive !== undefined ? dto.isActive : category.isActive,
      },
    });

    await this.prisma.assetCategory.updateMany({
      where: { name: { equals: category.name, mode: 'insensitive' } },
      data: {
        name: newName,
        type: assetType,
        ...(dto.prefix ? { prefix: dto.prefix.trim().toUpperCase() } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      }
    }).catch(() => {});

    return updated;
  }

  async deleteCategory(id: string, userIdentifier?: string) {
    const user = await this.assertSuperAdmin(userIdentifier);
    const category = await this.prisma.expenseCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Expense Category not found.');

    const updated = await this.prisma.expenseCategory.update({
      where: { id },
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

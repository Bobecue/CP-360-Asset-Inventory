import { Injectable, ForbiddenException, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto, CreateSiteDto, UpdateSiteDto } from './dto/category.dto';
import { ExpenseCategoryType, CategoryAuditAction } from '@prisma/client';

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultCategories();
  }

  // Helper: Resolve user & assert Super Admin
  private async assertSuperAdmin(userIdentifier?: string) {
    if (!userIdentifier) throw new ForbiddenException('Super Admin access required.');
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: userIdentifier },
          { id: userIdentifier },
          { name: userIdentifier },
        ]
      }
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Access Denied: Management Category configuration is restricted to Super Admin users.');
    }
    return user;
  }

  // Seed default categories & backfill OpexEntry relations
  async seedDefaultCategories() {
    const defaultCategories = [
      { name: 'OFFICE_SUPPLIES', type: ExpenseCategoryType.OPEX },
      { name: 'MEDICAL_PHARMACY', type: ExpenseCategoryType.OPEX },
      { name: 'SECURITY_UNIFORM', type: ExpenseCategoryType.OPEX },
      { name: 'IT_PERIPHERALS', type: ExpenseCategoryType.CAPEX },
      { name: 'MAINTENANCE_REPAIRS', type: ExpenseCategoryType.OPEX },
      { name: 'UTILITIES', type: ExpenseCategoryType.OPEX },
      { name: 'FACILITIES', type: ExpenseCategoryType.CAPEX },
      { name: 'MISCELLANEOUS', type: ExpenseCategoryType.OPEX },
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

    return categories.map(c => ({
      ...c,
      transactionCount: c._count.opexEntries,
    }));
  }

  async createCategory(dto: CreateCategoryDto, userIdentifier?: string) {
    const user = await this.assertSuperAdmin(userIdentifier);

    const formattedName = dto.name.trim().toUpperCase().replace(/\s+/g, '_');
    const existing = await this.prisma.expenseCategory.findUnique({ where: { name: formattedName } });
    if (existing) throw new BadRequestException(`Category "${formattedName}" already exists.`);

    const category = await this.prisma.expenseCategory.create({
      data: {
        name: formattedName,
        type: dto.type || ExpenseCategoryType.OPEX,
        isActive: true,
        createdByUserId: user.id,
      },
    });

    await this.prisma.categoryAuditLog.create({
      data: {
        categoryId: category.id,
        action: CategoryAuditAction.CREATED,
        performedByUserId: user.id,
        newValue: JSON.stringify({ name: category.name, type: category.type }),
      },
    });

    return category;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto, userIdentifier?: string) {
    const user = await this.assertSuperAdmin(userIdentifier);
    const category = await this.prisma.expenseCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Expense Category not found.');

    const previousValue = JSON.stringify({ name: category.name, type: category.type, isActive: category.isActive });

    let newName = category.name;
    if (dto.name && dto.name.trim()) {
      newName = dto.name.trim().toUpperCase().replace(/\s+/g, '_');
      if (newName !== category.name) {
        const dup = await this.prisma.expenseCategory.findUnique({ where: { name: newName } });
        if (dup) throw new BadRequestException(`Category "${newName}" already exists.`);
      }
    }

    let action: CategoryAuditAction = CategoryAuditAction.RENAMED;
    if (dto.isActive !== undefined && dto.isActive !== category.isActive) {
      action = dto.isActive ? CategoryAuditAction.REACTIVATED : CategoryAuditAction.DEACTIVATED;
    }

    const updated = await this.prisma.expenseCategory.update({
      where: { id },
      data: {
        name: newName,
        type: dto.type !== undefined ? dto.type : category.type,
        isActive: dto.isActive !== undefined ? dto.isActive : category.isActive,
      },
    });

    await this.prisma.categoryAuditLog.create({
      data: {
        categoryId: updated.id,
        action,
        performedByUserId: user.id,
        previousValue,
        newValue: JSON.stringify({ name: updated.name, type: updated.type, isActive: updated.isActive }),
      },
    });

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

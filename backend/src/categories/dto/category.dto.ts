import { ExpenseCategoryType, CategoryAuditAction } from '@prisma/client';

export class CreateCategoryDto {
  name: string;
  type?: string;
  expenseType?: ExpenseCategoryType;
  prefix?: string;
}

export class UpdateCategoryDto {
  name?: string;
  type?: string;
  expenseType?: ExpenseCategoryType;
  prefix?: string;
  isActive?: boolean;
}

export class CreateSiteDto {
  name: string;
  prefix?: string;
  address?: string;
}

export class UpdateSiteDto {
  name?: string;
  prefix?: string;
  address?: string;
  isActive?: boolean;
}

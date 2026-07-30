import { ExpenseCategoryType, CategoryAuditAction } from '@prisma/client';

export class CreateCategoryDto {
  name: string;
  type?: ExpenseCategoryType;
}

export class UpdateCategoryDto {
  name?: string;
  type?: ExpenseCategoryType;
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

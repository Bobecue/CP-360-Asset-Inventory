import { OpexUnit, OpexCategory, OpexStatus } from '@prisma/client';

export class CreateOpexEntryDto {
  itemDescription: string;
  brand?: string;
  unitPrice: number;
  qty: number;
  unit?: OpexUnit;
  category?: OpexCategory;
  supplierId?: string;
  supplierName?: string;
  departmentId?: string;
  destinationName?: string;
  siteId?: string;
  sourceDocumentUrl?: string;
  transactionDate?: string;
  isCapex?: boolean;
}

export class UpdateOpexEntryDto {
  itemDescription?: string;
  brand?: string;
  unitPrice?: number;
  qty?: number;
  unit?: OpexUnit;
  category?: OpexCategory;
  supplierId?: string;
  supplierName?: string;
  departmentId?: string;
  destinationName?: string;
  siteId?: string;
  sourceDocumentUrl?: string;
  transactionDate?: string;
  isCapex?: boolean;
}

export class ApproveOpexEntryDto {
  status: OpexStatus;
  rejectionReason?: string;
  sourceDocumentUrl?: string;
}

export class LockMonthDto {
  year: number;
  month: number;
  password?: string;
}

export class UnlockMonthDto {
  year: number;
  month: number;
  reason: string;
  password?: string;
}

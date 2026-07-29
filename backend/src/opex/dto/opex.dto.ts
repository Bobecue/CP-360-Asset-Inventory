import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsBoolean, Min } from 'class-validator';
import { OpexUnit, OpexCategory, OpexStatus } from '@prisma/client';

export class CreateOpexEntryDto {
  @IsString()
  @IsNotEmpty()
  itemDescription: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @Min(0.01)
  qty: number;

  @IsEnum(OpexUnit)
  @IsOptional()
  unit?: OpexUnit;

  @IsEnum(OpexCategory)
  @IsOptional()
  category?: OpexCategory;

  @IsString()
  @IsOptional()
  supplierId?: string;

  @IsString()
  @IsOptional()
  supplierName?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  destinationName?: string;

  @IsString()
  @IsOptional()
  siteId?: string;

  @IsString()
  @IsOptional()
  sourceDocumentUrl?: string;

  @IsString()
  @IsOptional()
  transactionDate?: string;

  @IsBoolean()
  @IsOptional()
  isCapex?: boolean;
}

export class UpdateOpexEntryDto {
  @IsString()
  @IsOptional()
  itemDescription?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  unitPrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(0.01)
  qty?: number;

  @IsEnum(OpexUnit)
  @IsOptional()
  unit?: OpexUnit;

  @IsEnum(OpexCategory)
  @IsOptional()
  category?: OpexCategory;

  @IsString()
  @IsOptional()
  supplierId?: string;

  @IsString()
  @IsOptional()
  supplierName?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  destinationName?: string;

  @IsString()
  @IsOptional()
  siteId?: string;

  @IsString()
  @IsOptional()
  sourceDocumentUrl?: string;

  @IsString()
  @IsOptional()
  transactionDate?: string;

  @IsBoolean()
  @IsOptional()
  isCapex?: boolean;
}

export class ApproveOpexEntryDto {
  @IsEnum(OpexStatus)
  status: OpexStatus;

  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @IsString()
  @IsOptional()
  sourceDocumentUrl?: string;
}

export class LockMonthDto {
  @IsNumber()
  year: number;

  @IsNumber()
  month: number;
}

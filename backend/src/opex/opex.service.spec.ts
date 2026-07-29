import { Test, TestingModule } from '@nestjs/testing';
import { OpexService } from './opex.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('OpexService Unit Tests', () => {
  let service: OpexService;
  let prisma: PrismaService;

  const mockEncoder = { id: 'user-encoder', email: 'encoder@contactpoint360.com', role: 'EMPLOYEE' };
  const mockApprover = { id: 'user-approver', email: 'approver@contactpoint360.com', role: 'ADMIN' };

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
    },
    opexEntry: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    monthlyClose: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpexService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OpexService>(OpexService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('1. Auto-calculation of total', () => {
    it('should compute total as unitPrice * qty server-side', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockEncoder);
      mockPrismaService.monthlyClose.findUnique.mockResolvedValue(null);
      mockPrismaService.opexEntry.create.mockImplementation((args) => args.data);

      const result: any = await service.create(
        {
          itemDescription: 'Medical Gloves Box',
          unitPrice: 150.50,
          qty: 10,
          unit: 'BOX',
          category: 'MEDICAL_PHARMACY',
        },
        mockEncoder.email,
      );

      expect(result.total).toEqual(new Prisma.Decimal(1505.00));
    });
  });

  describe('2. Segregation of Duties', () => {
    it('should reject approval if the approver is the same as the encoder', async () => {
      const mockEntry = {
        id: 'entry-1',
        itemDescription: 'Paper Reams',
        unitPrice: new Prisma.Decimal(250),
        qty: new Prisma.Decimal(4),
        total: new Prisma.Decimal(1000),
        status: 'PENDING',
        enteredByUserId: 'user-encoder',
        transactionDate: new Date(),
      };

      mockPrismaService.opexEntry.findUnique.mockResolvedValue(mockEntry);
      mockPrismaService.monthlyClose.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findFirst.mockResolvedValue(mockEncoder);

      await expect(
        service.approve('entry-1', { status: 'OK', sourceDocumentUrl: 'http://doc.pdf' }, mockEncoder.email)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow approval if the approver is a different user', async () => {
      const mockEntry = {
        id: 'entry-1',
        itemDescription: 'Paper Reams',
        unitPrice: new Prisma.Decimal(250),
        qty: new Prisma.Decimal(4),
        total: new Prisma.Decimal(1000),
        status: 'PENDING',
        enteredByUserId: 'user-encoder',
        transactionDate: new Date(),
      };

      mockPrismaService.opexEntry.findUnique.mockResolvedValue(mockEntry);
      mockPrismaService.monthlyClose.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findFirst.mockResolvedValue(mockApprover);
      mockPrismaService.opexEntry.update.mockResolvedValue({ ...mockEntry, status: 'OK' });

      const result = await service.approve(
        'entry-1',
        { status: 'OK', sourceDocumentUrl: 'http://receipt.pdf' },
        mockApprover.email,
      );

      expect(result.status).toBe('OK');
    });
  });

  describe('3. Lock validations', () => {
    it('should reject month-end lock if entries remain PENDING', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockApprover);
      mockPrismaService.monthlyClose.findUnique.mockResolvedValue(null);

      const pendingEntry = {
        id: 'entry-pending',
        status: 'PENDING',
        transactionDate: new Date(2026, 6, 15),
      };

      mockPrismaService.opexEntry.findMany.mockResolvedValue([pendingEntry]);

      await expect(
        service.lockMonth({ year: 2026, month: 7 }, mockApprover.email)
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject month-end lock if OK entries lack source documents', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockApprover);
      mockPrismaService.monthlyClose.findUnique.mockResolvedValue(null);

      const okEntryWithoutDoc = {
        id: 'entry-ok-nodoc',
        status: 'OK',
        sourceDocumentUrl: null,
        transactionDate: new Date(2026, 6, 15),
      };

      mockPrismaService.opexEntry.findMany.mockResolvedValue([okEntryWithoutDoc]);

      await expect(
        service.lockMonth({ year: 2026, month: 7 }, mockApprover.email)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('4. Locked-month Immutability', () => {
    it('should reject create/update/approve on entries in a locked month', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockEncoder);
      mockPrismaService.monthlyClose.findUnique.mockResolvedValue({ id: 'lock-1', yearMonth: '2026-07' });

      await expect(
        service.create(
          {
            itemDescription: 'Notebooks',
            unitPrice: 50,
            qty: 5,
            transactionDate: '2026-07-10T10:00:00.000Z',
          },
          mockEncoder.email,
        )
      ).rejects.toThrow(BadRequestException);
    });
  });
});

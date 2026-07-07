import { Injectable, OnModuleInit, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export type Req = {
  id: string;
  itemId: string;
  itemName: string;
  itemCategory?: string;
  requestedById: string;
  requestedByName: string;
  requestedByRole?: string;
  requestedByDepartment?: string;
  quantity: number;
  reason: string;
  urgency: string;
  status: 'PENDING' | 'PENDING_OPS_APPROVAL' | 'APPROVED' | 'READY_FOR_PICKUP' | 'PENDING_PROCUREMENT' | 'REJECTED' | 'RETURNED' | 'CANCELLED' | 'RELEASED' | 'AWAITING_CONFIRMATION' | 'ITEM_RECEIVED';
  reviewComment?: string;
  returnComment?: string;
  returnedAt?: string;
  receivedByName?: string;
  receivedAt?: string;
  senderName?: string;
  senderSiteName?: string;
  senderSiteAddress?: string;
  receiverName?: string;
  receiverSiteName?: string;
  receiverSiteAddress?: string;
  staffApprovedById?: string;
  staffApprovedByName?: string;
  staffApprovedAt?: string;
  opsApprovedById?: string;
  opsApprovedByName?: string;
  opsApprovedAt?: string;
  siteId?: string;
  siteName?: string;
  approvedByName?: string;
  requestedBySiteId?: string;
  approvedBySiteId?: string;
  assetId?: string;
  assetTag?: string;
  createdAt: string;
  history?: { status: string; comment?: string; timestamp: string; byName?: string }[];
};

@Injectable()
export class RequestsService implements OnModuleInit {
  constructor(private prisma: PrismaService) { }

  async onModuleInit() {
    const count = await this.prisma.request.count();
    if (count > 0) return;

    console.log('Seeding mock requests into database...');

    // 1. Ensure Sites exist
    const cebSite = await this.prisma.site.upsert({
      where: { prefix: 'CEB' },
      update: {},
      create: { name: 'Cebu IT Park', prefix: 'CEB' },
    });
    const torSite = await this.prisma.site.upsert({
      where: { prefix: 'TOR' },
      update: {},
      create: { name: 'Toronto HQ', prefix: 'TOR' },
    });
    const ldnSite = await this.prisma.site.upsert({
      where: { prefix: 'LDN' },
      update: {},
      create: { name: 'London Office', prefix: 'LDN' },
    });

    // 2. Ensure Users exist
    const defaultPasswordHash = '$2b$10$q7Jq5HiZdRkZ4lSqvtR4z.JOwjMZME.d8Q8ifcOYywevdb1.PkXn6'; // default dummy (SuperAdmin360!)
    const elena = await this.prisma.user.upsert({
      where: { email: 'elena@contactpoint360.com' },
      update: {},
      create: {
        email: 'elena@contactpoint360.com',
        name: 'Elena Rostova',
        passwordHash: defaultPasswordHash,
        role: 'EMPLOYEE',
        siteId: torSite.id,
      },
    });
    const markus = await this.prisma.user.upsert({
      where: { email: 'markus@contactpoint360.com' },
      update: {},
      create: {
        email: 'markus@contactpoint360.com',
        name: 'Markus Chen',
        passwordHash: defaultPasswordHash,
        role: 'EMPLOYEE',
        siteId: cebSite.id,
      },
    });
    const admin = await this.prisma.user.upsert({
      where: { email: 'superadmin@contactpoint360.com' },
      update: {},
      create: {
        email: 'superadmin@contactpoint360.com',
        name: 'Super Admin',
        passwordHash: defaultPasswordHash,
        role: 'SUPER_ADMIN',
        siteId: torSite.id,
      },
    });

    // 3. Ensure Asset Categories exist
    const eqpCategory = await this.prisma.assetCategory.upsert({
      where: { prefix: 'EQP' },
      update: {},
      create: { name: 'Equipment', prefix: 'EQP', type: 'NON_CONSUMABLE' },
    });
    const cabCategory = await this.prisma.assetCategory.upsert({
      where: { prefix: 'CAB' },
      update: {},
      create: { name: 'Cables', prefix: 'CAB', type: 'CONSUMABLE' },
    });
    const accCategory = await this.prisma.assetCategory.upsert({
      where: { prefix: 'ACC' },
      update: {},
      create: { name: 'Accessories', prefix: 'ACC', type: 'NON_CONSUMABLE' },
    });
    const monCategory = await this.prisma.assetCategory.upsert({
      where: { prefix: 'MON' },
      update: {},
      create: { name: 'Monitors', prefix: 'MON', type: 'NON_CONSUMABLE' },
    });
    const conCategory = await this.prisma.assetCategory.upsert({
      where: { prefix: 'CON' },
      update: {},
      create: { name: 'Consumables', prefix: 'CON', type: 'CONSUMABLE' },
    });

    // 4. Ensure Catalog Items exist
    const macbook = await this.prisma.item.upsert({
      where: { sku: 'IT-MBP-14' },
      update: {},
      create: { name: 'MacBook Pro 14" M3', sku: 'IT-MBP-14', categoryId: eqpCategory.id },
    });
    const mxmaster = await this.prisma.item.upsert({
      where: { sku: 'ACC-MXM3S' },
      update: {},
      create: { name: 'Logitech MX Master 3S', sku: 'ACC-MXM3S', categoryId: accCategory.id },
    });
    const ethernet = await this.prisma.item.upsert({
      where: { sku: 'CAB-CAT6-10M' },
      update: {},
      create: { name: 'CAT6 Ethernet Cable (10m)', sku: 'CAB-CAT6-10M', categoryId: cabCategory.id },
    });
    const monitor = await this.prisma.item.upsert({
      where: { sku: 'MON-DEL27' },
      update: {},
      create: { name: 'Dell 27" Monitor U2723QE', sku: 'MON-DEL27', categoryId: monCategory.id },
    });
    const jabra = await this.prisma.item.upsert({
      where: { sku: 'ACC-JAB65' },
      update: {},
      create: { name: 'Jabra Evolve2 65 Headset', sku: 'ACC-JAB65', categoryId: accCategory.id },
    });
    const batteries = await this.prisma.item.upsert({
      where: { sku: 'CON-BATT-AA' },
      update: { categoryId: conCategory.id },
      create: { name: 'AA Alkaline Batteries (4-pack)', sku: 'CON-BATT-AA', categoryId: conCategory.id },
    });

    // 5. Create seed Requests (REMOVED to keep request table clean)
    await this.prisma.siteStock.createMany({
      data: [
        { siteId: cebSite.id, itemId: macbook.id, quantity: 10 },
        { siteId: torSite.id, itemId: macbook.id, quantity: 14 },
        { siteId: ldnSite.id, itemId: macbook.id, quantity: 5 },
        { siteId: cebSite.id, itemId: mxmaster.id, quantity: 15 },
        { siteId: torSite.id, itemId: mxmaster.id, quantity: 20 },
        { siteId: ldnSite.id, itemId: mxmaster.id, quantity: 8 },
        { siteId: cebSite.id, itemId: ethernet.id, quantity: 6 },
        { siteId: torSite.id, itemId: ethernet.id, quantity: 6 },
        { siteId: ldnSite.id, itemId: ethernet.id, quantity: 12 },
        { siteId: cebSite.id, itemId: monitor.id, quantity: 1 },
        { siteId: torSite.id, itemId: monitor.id, quantity: 2 },
        { siteId: ldnSite.id, itemId: monitor.id, quantity: 3 },
        { siteId: cebSite.id, itemId: jabra.id, quantity: 5 },
        { siteId: torSite.id, itemId: jabra.id, quantity: 10 },
        { siteId: ldnSite.id, itemId: jabra.id, quantity: 4 },
      ],
      skipDuplicates: true,
    });
    console.log('Site stock levels seeded successfully.');
  }

  private requestInclude = {
    item: {
      include: { category: true }
    },
    requester: {
      include: { site: true }
    },
    approver: {
      include: { site: true }
    },
    releasedBy: {
      include: { site: true }
    },
    receivedBy: {
      include: { site: true }
    },
    staffApproved: {
      include: { site: true }
    },
    opsApproved: {
      include: { site: true }
    },
    asset: {
      include: { item: true }
    },
    events: {
      include: { user: true, receivedBy: true },
      orderBy: { createdAt: 'asc' as const }
    },
  };

  private mapRequestToDto(r: any): Req {
    let reason = r.purpose || '';
    let urgency = 'NORMAL';
    let quantity = 1;
    let returnComment = undefined;
    let returnedAtStr = r.returnedAt ? new Date(r.returnedAt).toISOString() : undefined;
    let siteId = r.requester.siteId || undefined;
    let siteName = r.requester.site?.name || undefined;

    try {
      if (r.purpose && r.purpose.startsWith('{')) {
        const parsed = JSON.parse(r.purpose);
        reason = parsed.reason || '';
        urgency = parsed.urgency || 'NORMAL';
        quantity = parsed.quantity || 1;
        returnComment = parsed.returnComment;
        if (parsed.returnedAt) returnedAtStr = parsed.returnedAt;
        if (parsed.siteId) siteId = parsed.siteId;
        if (parsed.siteName) siteName = parsed.siteName;
      }
    } catch { }

    let statusDto: 'PENDING' | 'PENDING_OPS_APPROVAL' | 'APPROVED' | 'READY_FOR_PICKUP' | 'PENDING_PROCUREMENT' | 'REJECTED' | 'RETURNED' | 'CANCELLED' | 'RELEASED' | 'AWAITING_CONFIRMATION' | 'ITEM_RECEIVED' = 'PENDING';
    if (r.status === 'PENDING_OPS_APPROVAL') statusDto = 'PENDING_OPS_APPROVAL';
    if (r.status === 'APPROVED') statusDto = 'APPROVED';
    if (r.status === 'READY_FOR_PICKUP') statusDto = 'READY_FOR_PICKUP';
    if (r.status === 'PENDING_PROCUREMENT') statusDto = 'PENDING_PROCUREMENT';
    if (r.status === 'REJECTED') {
      if (r.comments === 'Cancelled by requester.') {
        statusDto = 'CANCELLED';
      } else {
        statusDto = 'REJECTED';
      }
    }
    if (r.status === 'RELEASED') statusDto = 'RELEASED';
    if (r.status === 'AWAITING_CONFIRMATION') statusDto = 'AWAITING_CONFIRMATION';
    if (r.status === 'ITEM_RECEIVED') statusDto = 'ITEM_RECEIVED';
    if (r.status === 'RETURNED') statusDto = 'RETURNED';
    if (r.status === 'CANCELLED') statusDto = 'CANCELLED';

    let approvedByName = r.approver?.name || undefined;
    if (r.releasedBy) {
      approvedByName = `${approvedByName || 'Super Admin'} (Released by ${r.releasedBy.name})`;
    }

    let itemName = r.item.name;
    if (r.asset?.item?.name) {
      itemName = r.asset.item.name;
    }

    return {
      id: r.id,
      itemId: r.itemId,
      itemName,
      itemCategory: r.item.category?.type === 'CONSUMABLE' ? 'Consumables' : r.item.category?.name,
      requestedById: r.requesterId,
      requestedByName: r.requester.name,
      requestedByRole: r.requester.role,
      requestedByDepartment: r.requester.department,
      requestedBySiteId: r.requester.siteId || undefined,
      quantity,
      reason,
      urgency,
      status: statusDto,
      reviewComment: r.comments || undefined,
      returnComment,
      returnedAt: returnedAtStr,
      receivedByName: r.receivedBy?.name || undefined,
      receivedAt: r.receivedAt ? r.receivedAt.toISOString() : undefined,
      senderName: r.releasedBy?.name || undefined,
      senderSiteName: r.releasedBy?.site?.name || undefined,
      senderSiteAddress: r.releasedBy?.site?.address || undefined,
      receiverName: r.receivedBy?.name || r.requester?.name || undefined,
      receiverSiteName: r.receivedBy?.site?.name || r.requester?.site?.name || undefined,
      receiverSiteAddress: r.receivedBy?.site?.address || r.requester?.site?.address || undefined,
      staffApprovedById: r.staffApprovedById || undefined,
      staffApprovedByName: r.staffApproved?.name || undefined,
      staffApprovedAt: r.staffApprovedAt ? r.staffApprovedAt.toISOString() : undefined,
      opsApprovedById: r.opsApprovedById || undefined,
      opsApprovedByName: r.opsApproved?.name || undefined,
      opsApprovedAt: r.opsApprovedAt ? r.opsApprovedAt.toISOString() : undefined,
      siteId,
      siteName,
      approvedByName,
      approvedBySiteId: r.approver?.siteId || r.releasedBy?.siteId || undefined,
      createdAt: r.createdAt.toISOString(),
      assetId: r.assetId || undefined,
      assetTag: r.asset?.tagCode || undefined,
      history: r.events?.map((e: any) => ({
        status: e.status,
        comment: e.comment || undefined,
        timestamp: e.createdAt.toISOString(),
        byName: e.user?.name || undefined,
        receivedBy: e.receivedBy?.name || undefined
      })) || []
    };
  }

  async create(dto: any, userEmail: string) {
    let item: any = null;

    // Prefer itemId lookup (sent by frontend), fall back to name
    if (dto.itemId) {
      item = await this.prisma.item.findUnique({
        where: { id: dto.itemId }
      });
    }
    if (!item && dto.item) {
      item = await this.prisma.item.findFirst({
        where: { name: dto.item }
      });
    }
    if (!item) {
      let category = null;
      if (dto.category) {
        category = await this.prisma.assetCategory.findFirst({
          where: { name: { equals: dto.category, mode: 'insensitive' } }
        });
        if (!category && dto.category === 'Consumables') {
          category = await this.prisma.assetCategory.findFirst({
            where: { type: 'CONSUMABLE' }
          });
        }
      }
      if (!category) {
        category = await this.prisma.assetCategory.findFirst();
      }
      const count = await this.prisma.item.count({ where: { categoryId: category ? category.id : 'default-cat' } });
      const sequence = count + 1;
      const catName = category ? category.name : 'Unknown';
      const padded = String(sequence).padStart(4, '0');
      const prefix =
        catName.toLowerCase().includes('laptop') ? 'LAP' :
          catName.toLowerCase().includes('accessory') || catName.toLowerCase().includes('accessories') ? 'ACC' :
            'ITM';
      const generatedSku = `${prefix}-${padded}`;

      item = await this.prisma.item.create({
        data: {
          name: dto.item || dto.itemId || 'Unknown Item',
          sku: generatedSku,
          categoryId: category ? category.id : 'default-cat'
        }
      });
    }

    let requester = await this.prisma.user.findFirst({
      where: { email: userEmail }
    });
    if (!requester) {
      requester = await this.prisma.user.findFirst();
    }
    if (!requester) {
      throw new NotFoundException('No requester user found in database.');
    }

    if (!dto.siteId) {
      throw new BadRequestException('Site is required.');
    }

    let siteObj = await this.prisma.site.findUnique({
      where: { id: dto.siteId }
    });
    if (!siteObj) {
      siteObj = await this.prisma.site.findFirst({
        where: { name: { equals: dto.siteId, mode: 'insensitive' } }
      });
    }
    if (!siteObj) {
      throw new NotFoundException(`Site with ID/Name ${dto.siteId} not found.`);
    }
    const siteName = siteObj.name;

    const purposeJson = JSON.stringify({
      reason: dto.reason,
      urgency: dto.urgency || 'NORMAL',
      quantity: dto.quantity || 1,
      siteId: siteObj.id,
      siteName: siteName
    });

    const r = await this.prisma.request.create({
      data: {
        id: `req-${uuidv4().substring(0, 8)}`,
        status: 'PENDING_APPROVAL',
        purpose: purposeJson,
        itemId: item.id,
        requesterId: requester.id,
        events: {
          create: {
            status: 'PENDING_APPROVAL',
            userId: requester.id
          }
        }
      },
      include: this.requestInclude
    });

    return this.mapRequestToDto(r);
  }

  async findAll(q: any, user: string) {
    const dbRequests = await this.prisma.request.findMany({
      include: this.requestInclude,
      orderBy: { createdAt: 'desc' }
    });
    return dbRequests.map(r => this.mapRequestToDto(r));
  }

  async getSummary(user: string) {
    const dbRequests = await this.prisma.request.findMany({
      include: this.requestInclude,
    });
    const items = dbRequests.map(r => this.mapRequestToDto(r));

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const approvedStatuses = ['APPROVED', 'READY_FOR_PICKUP', 'RELEASED', 'RETURNED', 'PENDING_PROCUREMENT'];
    const pending = items.filter(r => r.status === 'PENDING');
    const approvedThisMonth = items.filter(r =>
      approvedStatuses.includes(r.status) && new Date(r.createdAt) >= startOfMonth
    );
    const rejectedThisMonth = items.filter(r =>
      r.status === 'REJECTED' && new Date(r.createdAt) >= startOfMonth
    );
    const pendingYesterday = items.filter(r => r.status === 'PENDING' && new Date(r.createdAt) < yesterday);

    const urgencyBreakdown = { CRITICAL: 0, HIGH: 0, NORMAL: 0, LOW: 0 };
    pending.forEach(r => {
      const u = (r.urgency || 'NORMAL').toUpperCase() as keyof typeof urgencyBreakdown;
      if (urgencyBreakdown[u] !== undefined) {
        urgencyBreakdown[u]++;
      }
    });

    const latestPending = pending.slice(0, 3).map(r => ({
      id: r.id,
      itemName: r.itemName,
      requestedBy: r.requestedByName,
      site: r.siteName || 'Toronto HQ',
      quantity: r.quantity,
      urgency: r.urgency as 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW',
      createdAt: r.createdAt,
    }));

    return {
      pending: pending.length,
      approvedThisMonth: approvedThisMonth.length,
      rejectedThisMonth: rejectedThisMonth.length,
      avgApprovalDays: 1.4,
      pendingDelta: pending.length - pendingYesterday.length,
      urgencyBreakdown,
      latestPending,
    };
  }

  async findMine(userEmail: string, status?: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: userEmail }
    });
    if (!user) {
      return { items: [], pendingCount: 0 };
    }

    const dbRequests = await this.prisma.request.findMany({
      where: { requesterId: user.id },
      include: this.requestInclude,
      orderBy: { createdAt: 'desc' }
    });

    let items = dbRequests.map(r => this.mapRequestToDto(r));
    if (status && status !== 'ALL') {
      items = items.filter(r => r.status.toUpperCase() === status.toUpperCase());
    }

    const pendingCount = dbRequests.filter(r => r.status === 'PENDING_APPROVAL').length;
    return { items, pendingCount };
  }

  async findOne(id: string) {
    const r = await this.prisma.request.findUnique({
      where: { id },
      include: this.requestInclude,
    });
    if (!r) return null;
    return this.mapRequestToDto(r);
  }

  async approve(id: string, comment?: string, approverEmail?: string) {
    throw new BadRequestException('Direct approval is disabled. Please use approveStaff or approveOps.');
  }

  async reject(id: string, comment?: string, approverEmail?: string) {
    let approverConnect = undefined;
    if (approverEmail) {
      const u = await this.prisma.user.findUnique({ where: { email: approverEmail } });
      if (u) {
        if (u.role === 'SUPER_ADMIN') {
          throw new BadRequestException('Super Admins are unauthorized to reject requests.');
        }
        approverConnect = { connect: { id: u.id } };
      }
    }

    const currentReq = await this.prisma.request.findUnique({ where: { id } });
    if (!currentReq) throw new NotFoundException('Request not found');
    if (currentReq.status !== 'PENDING_APPROVAL' && currentReq.status !== 'PENDING_OPS_APPROVAL') {
      throw new BadRequestException(`Cannot reject a request that is currently ${currentReq.status}.`);
    }

    const r = await this.prisma.request.update({
      where: { id },
      data: {
        status: 'REJECTED',
        comments: comment || null,
        approver: approverConnect,
        events: {
          create: {
            status: 'REJECTED',
            comment: comment || null,
            userId: approverConnect?.connect?.id
          }
        }
      },
      include: this.requestInclude,
    });
    return this.mapRequestToDto(r);
  }

  async approveStaff(id: string, staffEmail: string, comment?: string) {
    const u = await this.prisma.user.findUnique({ where: { email: staffEmail } });
    if (!u) {
      throw new NotFoundException('User not found');
    }
    if (u.role !== 'INVENTORY_STAFF') {
      throw new ForbiddenException('Only Inventory Staff can perform staff approval.');
    }

    const currentReq = await this.prisma.request.findUnique({ where: { id } });
    if (!currentReq) {
      throw new NotFoundException('Request not found');
    }
    if (currentReq.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Cannot staff-approve a request that is currently ${currentReq.status}.`);
    }

    const r = await this.prisma.request.update({
      where: { id },
      data: {
        status: 'PENDING_OPS_APPROVAL',
        staffApprovedById: u.id,
        staffApprovedAt: new Date(),
        events: {
          create: {
            status: 'PENDING_OPS_APPROVAL',
            comment: comment || 'Approved by Inventory Staff — awaiting Ops Manager approval',
            userId: u.id
          }
        }
      },
      include: this.requestInclude,
    });
    return this.mapRequestToDto(r);
  }

  async approveOps(id: string, opsEmail: string, comment?: string) {
    const u = await this.prisma.user.findUnique({ where: { email: opsEmail } });
    if (!u) {
      throw new NotFoundException('User not found');
    }
    if (u.role !== 'ADMIN') {
      throw new ForbiddenException('Only Ops Manager can perform ops approval.');
    }

    const currentReq = await this.prisma.request.findUnique({
      where: { id },
      include: { requester: true, item: { include: { category: true } } }
    });
    if (!currentReq) {
      throw new NotFoundException('Request not found');
    }
    if (currentReq.status !== 'PENDING_OPS_APPROVAL') {
      throw new BadRequestException(`Cannot ops-approve a request that is currently ${currentReq.status}.`);
    }

    // Separation of duties
    if (currentReq.staffApprovedById === u.id) {
      throw new ForbiddenException('Separation of duties: The same user cannot perform both staff and ops approvals.');
    }

    let parsedPurpose: any = {};
    try {
      if (currentReq.purpose && currentReq.purpose.startsWith('{')) {
        parsedPurpose = JSON.parse(currentReq.purpose);
      }
    } catch { }

    const quantity = parsedPurpose.quantity || 1;
    let siteId = parsedPurpose.siteId || currentReq.requester.siteId;
    let siteName = parsedPurpose.siteName || undefined;

    if (siteId) {
      let siteObj = await this.prisma.site.findUnique({
        where: { id: siteId }
      });
      if (!siteObj) {
        siteObj = await this.prisma.site.findFirst({
          where: { name: { equals: siteId, mode: 'insensitive' } }
        });
      }
      if (siteObj) {
        siteId = siteObj.id;
        siteName = siteObj.name;
        parsedPurpose.siteId = siteId;
        parsedPurpose.siteName = siteName;
      }
    }

    const updatedPurposeStr = JSON.stringify(parsedPurpose);

    // Dynamic stock level check (re-using approve logic)
    if (siteId && currentReq.item) {
      const categoryItems = await this.prisma.item.findMany({
        where: { categoryId: currentReq.item.categoryId }
      });
      const itemIds = categoryItems.map(i => i.id);

      const stocks = await this.prisma.siteStock.findMany({
        where: {
          siteId: siteId,
          itemId: { in: itemIds }
        }
      });
      const availableStock = stocks.reduce((sum, s) => sum + s.quantity, 0);

      if (availableStock < quantity) {
        if (availableStock > 0) {
          // Splitting logic
          const childQuantity = quantity - availableStock;

          for (const s of stocks) {
            await this.prisma.siteStock.update({
              where: { id: s.id },
              data: { quantity: 0 }
            });
          }

          parsedPurpose.quantity = availableStock;
          const splitPurposeStr = JSON.stringify(parsedPurpose);

          const childPurpose = { ...parsedPurpose, quantity: childQuantity, parentId: id };

          await this.prisma.request.create({
            data: {
              id: `req-${uuidv4().substring(0, 8)}`,
              status: 'PENDING_PROCUREMENT',
              purpose: JSON.stringify(childPurpose),
              itemId: currentReq.itemId,
              requesterId: currentReq.requesterId,
              opsApprovedById: u.id,
              comments: `Automatically generated from partial fulfillment of ${id}`,
              events: {
                create: {
                  status: 'PENDING_PROCUREMENT',
                  comment: 'Partial fulfillment backorder',
                  userId: u.id
                }
              }
            }
          });

          const r = await this.prisma.request.update({
            where: { id },
            data: {
              status: 'APPROVED',
              purpose: splitPurposeStr,
              comments: comment || 'Partially fulfilled due to low stock.',
              opsApprovedById: u.id,
              opsApprovedAt: new Date(),
              events: {
                create: {
                  status: 'APPROVED',
                  comment: comment || 'Request approved by Ops Manager',
                  userId: u.id
                }
              }
            },
            include: this.requestInclude,
          });
          return this.mapRequestToDto(r);

        } else {
          // No stock at all
          const r = await this.prisma.request.update({
            where: { id },
            data: {
              status: 'PENDING_PROCUREMENT',
              purpose: updatedPurposeStr,
              comments: comment || 'No stock available. Procurement needed.',
              opsApprovedById: u.id,
              opsApprovedAt: new Date(),
              events: {
                create: {
                  status: 'PENDING_PROCUREMENT',
                  comment: 'No stock available. Procurement needed.',
                  userId: u.id
                }
              }
            },
            include: this.requestInclude,
          });
          return this.mapRequestToDto(r);
        }
      }

      // Decrement stock from the category's items dynamically
      let remainingToDecrement = quantity;
      for (const s of stocks) {
        if (remainingToDecrement <= 0) break;
        const decrementAmount = Math.min(s.quantity, remainingToDecrement);
        await this.prisma.siteStock.update({
          where: { id: s.id },
          data: { quantity: { decrement: decrementAmount } }
        });
        remainingToDecrement -= decrementAmount;
      }
    }

    const r = await this.prisma.request.update({
      where: { id },
      data: {
        status: 'APPROVED',
        purpose: updatedPurposeStr,
        comments: comment || null,
        opsApprovedById: u.id,
        opsApprovedAt: new Date(),
        events: {
          create: {
            status: 'APPROVED',
            comment: comment || 'Approved by Ops Manager',
            userId: u.id
          }
        }
      },
      include: this.requestInclude,
    });
    return this.mapRequestToDto(r);
  }

  async preparePickup(id: string, staffEmail: string, comment?: string) {
    const u = await this.prisma.user.findUnique({ where: { email: staffEmail } });
    if (!u) {
      throw new NotFoundException('User not found');
    }
    if (u.role !== 'INVENTORY_STAFF') {
      throw new ForbiddenException('Only Inventory Staff can prepare/stage items for pickup.');
    }

    const currentReq = await this.prisma.request.findUnique({ where: { id } });
    if (!currentReq) {
      throw new NotFoundException('Request not found');
    }
    if (currentReq.status !== 'APPROVED') {
      throw new BadRequestException(`Cannot mark a request as Ready for Pickup if it is currently ${currentReq.status}.`);
    }

    const r = await this.prisma.request.update({
      where: { id },
      data: {
        status: 'READY_FOR_PICKUP',
        comments: comment || null,
        events: {
          create: {
            status: 'READY_FOR_PICKUP',
            comment: comment || 'Item staged and ready for pickup',
            userId: u.id
          }
        }
      },
      include: this.requestInclude,
    });
    return this.mapRequestToDto(r);
  }

  async release(id: string, assetId: string, releaserEmail: string) {
    const u = await this.prisma.user.findUnique({ where: { email: releaserEmail } });
    if (u && u.role === 'SUPER_ADMIN') {
      throw new BadRequestException('Super Admins are unauthorized to release requests.');
    }
    const req = await this.prisma.request.findUnique({ where: { id }, include: { item: true, requester: true } });
    if (!req) throw new NotFoundException('Request not found');

    if (req.status !== 'READY_FOR_PICKUP') {
      throw new BadRequestException('Cannot release a request that is not ready for pickup.');
    }

    if (u && u.id === req.requesterId) {
      throw new BadRequestException('A user cannot release their own request.');
    }

    return await this.prisma.$transaction(async (tx) => {
      let asset = await tx.asset.findUnique({ where: { tagCode: assetId } });
      if (asset && asset.status !== 'AVAILABLE') {
        throw new BadRequestException(`Asset Tag '${assetId}' is already checked out or unavailable. Please use a different tag.`);
      }
      if (!asset) {
        asset = await tx.asset.create({
          data: {
            serialNumber: `SN-${assetId}`,
            tagCode: assetId,
            status: 'ASSIGNED',
            itemId: req.itemId,
            siteId: req.requester.siteId || (await tx.site.findFirst())!.id,
            assignedToId: req.requesterId
          }
        });
      } else {
        asset = await tx.asset.update({
          where: { id: asset.id },
          data: { status: 'ASSIGNED', assignedToId: req.requesterId }
        });
      }

      const updatedReq = await tx.request.update({
        where: { id },
        data: {
          status: 'AWAITING_CONFIRMATION',
          releasedById: u ? u.id : undefined,
          releasedAt: new Date(),
          assetId: asset.id,
          events: {
            create: [
              {
                status: 'RELEASED',
                userId: u ? u.id : undefined
              },
              {
                status: 'AWAITING_CONFIRMATION',
                comment: 'Awaiting confirmation of receipt by requester'
              }
            ]
          },
          assetEvents: {
            create: {
              assetId: asset.id,
              action: 'CHECKED_OUT',
              userId: req.requesterId
            }
          }
        },
        include: this.requestInclude
      });
      return this.mapRequestToDto(updatedReq);
    });
  }

  async cancel(id: string) {
    const currentReq = await this.prisma.request.findUnique({ where: { id } });
    if (!currentReq) throw new NotFoundException('Request not found');
    if (currentReq.status !== 'PENDING_APPROVAL' && currentReq.status !== 'APPROVED' && currentReq.status !== 'READY_FOR_PICKUP') {
      throw new BadRequestException(`Cannot cancel a request that is currently ${currentReq.status}.`);
    }

    const r = await this.prisma.request.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        comments: 'Cancelled by requester.',
        events: {
          create: {
            status: 'CANCELLED',
            comment: 'Cancelled by requester.'
          }
        }
      },
      include: this.requestInclude,
    });
    return this.mapRequestToDto(r);
  }

  async return(id: string, returnComment?: string, returnerEmail?: string) {
    const r = await this.prisma.request.findUnique({
      where: { id }
    });
    if (!r) return null;

    if (r.status !== 'RELEASED' && r.status !== 'AWAITING_CONFIRMATION' && r.status !== 'ITEM_RECEIVED') {
      throw new BadRequestException(`Cannot return a request that is currently ${r.status}.`);
    }

    let adminUser = null;
    if (returnerEmail) {
      adminUser = await this.prisma.user.findUnique({ where: { email: returnerEmail } });
      if (adminUser && adminUser.role === 'SUPER_ADMIN') {
        throw new BadRequestException('Super Admins are unauthorized to process returns.');
      }
    }

    let parsedPurpose: any = {};
    try {
      if (r.purpose && r.purpose.startsWith('{')) {
        parsedPurpose = JSON.parse(r.purpose);
      } else {
        parsedPurpose = { reason: r.purpose || '' };
      }
    } catch {
      parsedPurpose = { reason: r.purpose || '' };
    }

    const nowStr = new Date().toISOString();
    parsedPurpose.returnComment = returnComment || null;
    parsedPurpose.returnedAt = nowStr;

    const updated = await this.prisma.request.update({
      where: { id },
      data: {
        status: 'RETURNED',
        returnedAt: new Date(),
        purpose: JSON.stringify(parsedPurpose),
        events: {
          create: {
            status: 'RETURNED',
            comment: returnComment || null,
            userId: adminUser?.id || null,
            receivedById: adminUser?.id || null
          }
        },
        ...(r.assetId ? {
          assetEvents: {
            create: {
              assetId: r.assetId,
              action: 'RETURNED',
              details: returnComment || null,
              userId: adminUser?.id || null
            }
          }
        } : {})
      },
      include: this.requestInclude,
    });

    if (r.assetId) {
      await this.prisma.asset.update({
        where: { id: r.assetId },
        data: { status: 'AVAILABLE', assignedToId: null }
      });
    }

    return this.mapRequestToDto(updated);
  }

  async addComment(id: string, comment: string, userEmail: string) {
    const r = await this.prisma.request.findUnique({
      where: { id }
    });
    if (!r) throw new NotFoundException(`Request ${id} not found.`);

    let u = await this.prisma.user.findFirst({
      where: { email: userEmail }
    });

    const updated = await this.prisma.request.update({
      where: { id },
      data: {
        events: {
          create: {
            status: r.status,
            comment: comment,
            userId: u ? u.id : undefined
          }
        }
      },
      include: this.requestInclude,
    });
    return this.mapRequestToDto(updated);
  }

  async confirmReceipt(id: string, userEmail: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: userEmail }
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const req = await this.prisma.request.findUnique({
      where: { id },
      include: this.requestInclude,
    });
    if (!req) {
      throw new NotFoundException('Request not found.');
    }

    // Idempotence check
    if (req.status === 'ITEM_RECEIVED') {
      return this.mapRequestToDto(req);
    }

    if (req.status !== 'AWAITING_CONFIRMATION') {
      throw new BadRequestException(`Cannot confirm receipt for a request in status ${req.status}.`);
    }

    // Verify ownership
    if (req.requesterId !== user.id) {
      throw new ForbiddenException('Only the original requester can confirm receipt of this item.');
    }

    const updated = await this.prisma.request.update({
      where: { id },
      data: {
        status: 'ITEM_RECEIVED',
        receivedById: user.id,
        receivedAt: new Date(),
        events: {
          create: {
            status: 'ITEM_RECEIVED',
            userId: user.id,
            comment: 'Receipt confirmed by requester'
          }
        }
      },
      include: this.requestInclude,
    });

    return this.mapRequestToDto(updated);
  }
}

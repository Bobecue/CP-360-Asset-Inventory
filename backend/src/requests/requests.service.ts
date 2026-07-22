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
  assetSiteName?: string;
  assetSiteAddress?: string;
  createdAt: string;
  history?: { status: string; comment?: string; timestamp: string; byName?: string }[];
};

@Injectable()
export class RequestsService implements OnModuleInit {
  constructor(private prisma: PrismaService) { }

  async onModuleInit() {
    // Auto-seeding disabled to prevent creation of unwanted mock sites and requests
    return;
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
      include: { item: true, site: true }
    },
    events: {
      include: { user: true, receivedBy: true },
      orderBy: { createdAt: 'asc' as const }
    },
  };


  private mapRequestToDto(r: any): Req {
    // Parse the purpose JSON to extract siteId, quantity, urgency, reason
    let parsedPurpose: any = {};
    let reason = '';
    try {
      parsedPurpose = JSON.parse(r.purpose || '{}');
      reason = parsedPurpose.reason || r.purpose || '';
    } catch {
      reason = r.purpose || '';
    }
    if (r.comments && !reason) reason = r.comments;
    const quantity = parsedPurpose.quantity || r.quantity || 1;
    const urgency = parsedPurpose.urgency || r.urgency || 'NORMAL';
    const returnedAtStr = r.returnedAt ? r.returnedAt.toISOString() : undefined;
    const siteId = parsedPurpose.siteId || r.requester?.siteId || undefined;
    const siteName = parsedPurpose.siteName || r.requester?.site?.name || undefined;

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
      returnComment: r.returnComment,
      returnedAt: returnedAtStr,
      receivedByName: r.receivedBy?.name || undefined,
      receivedAt: r.receivedAt ? r.receivedAt.toISOString() : undefined,
      senderName: r.releasedBy?.name || undefined,
      senderSiteName: r.releasedBy?.site?.name || undefined,
      senderSiteAddress: r.releasedBy?.site?.address || undefined,
      assetSiteName: r.asset?.site?.name || undefined,
      assetSiteAddress: r.asset?.site?.address || undefined,
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

    const isDeployment = dto.reason && dto.reason.includes('[ASSET DEPLOYMENT]');
    const initialStatus = isDeployment ? 'RELEASED' : 'PENDING_APPROVAL';

    let releasedByUserId = undefined;
    if (isDeployment) {
      releasedByUserId = requester.id;
    }

    let assignedAssetId: string | undefined = undefined;

    // Retrieve or assign asset tag for NON_CONSUMABLE items during deployment
    const fullItem = await this.prisma.item.findUnique({
      where: { id: item.id },
      include: { category: true, assets: true }
    });

    if (fullItem && fullItem.category?.type === 'NON_CONSUMABLE') {
      let availableAsset = fullItem.assets.find(
        (a) => a.status === 'AVAILABLE' && a.condition !== 'BAD' && a.condition !== 'DAMAGED' && a.siteId === siteObj.id
      );
      if (!availableAsset) {
        availableAsset = fullItem.assets.find(
          (a) => a.status === 'AVAILABLE' && a.condition !== 'BAD' && a.condition !== 'DAMAGED'
        );
      }

      if (!availableAsset) {
        const sitePrefix = siteObj.prefix || 'SK4';
        const catPrefix = fullItem.category?.prefix || 'EQP';

        const allMatchingAssets = await this.prisma.asset.findMany({
          where: {
            OR: [
              { itemId: item.id },
              { tagCode: { contains: `-${catPrefix}-` } }
            ]
          },
          select: { tagCode: true }
        });

        const numbers = allMatchingAssets.map((a) => {
          const parts = a.tagCode.split('-');
          const numStr = parts[parts.length - 1];
          const num = parseInt(numStr, 10);
          return isNaN(num) ? 0 : num;
        });
        const nextNum = Math.max(0, ...numbers) + 1;
        const generatedTagCode = `${sitePrefix}-${catPrefix}-${String(nextNum).padStart(4, '0')}`;
        const generatedSerial = `SN-${uuidv4().substring(0, 8).toUpperCase()}`;

        availableAsset = await this.prisma.asset.create({
          data: {
            tagCode: generatedTagCode,
            serialNumber: generatedSerial,
            status: 'AVAILABLE',
            condition: 'GOOD',
            itemId: item.id,
            siteId: siteObj.id,
          }
        });
      }

      if (availableAsset) {
        assignedAssetId = availableAsset.id;

        if (isDeployment) {
          await this.prisma.asset.update({
            where: { id: availableAsset.id },
            data: {
              status: 'ASSIGNED',
              assignedToId: requester.id
            }
          });

          await this.prisma.assetEvent.create({
            data: {
              assetId: availableAsset.id,
              action: 'DEPLOYED',
              details: `Deployed to ${dto.reason || 'Employee'}`,
              userId: requester.id,
            }
          });
        }
      }
    }

    if (isDeployment) {
      const deployQty = dto.quantity || 1;
      const stock = await this.prisma.siteStock.findFirst({
        where: {
          siteId: siteObj.id,
          itemId: item.id,
        }
      });
      if (stock) {
        await this.prisma.siteStock.update({
          where: { id: stock.id },
          data: { quantity: { decrement: deployQty } }
        });
      }
    }

    const r = await this.prisma.request.create({
      data: {
        id: `req-${uuidv4().substring(0, 8)}`,
        status: initialStatus,
        purpose: purposeJson,
        itemId: item.id,
        assetId: assignedAssetId,
        requesterId: requester.id,
        releasedById: releasedByUserId,
        releasedAt: isDeployment ? new Date() : undefined,
        events: {
          create: {
            status: initialStatus,
            userId: requester.id,
            comment: isDeployment ? '[ASSET DEPLOYMENT] Deployed directly by staff/admin' : undefined
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

  async getDashboardSummary(siteId?: string) {
    const activeSiteId = (siteId && siteId !== 'ALL' && siteId !== 'undefined' && siteId !== 'null' && siteId !== '') ? siteId : undefined;

    // 1. Total Cataloged Assets
    const totalAssets = await this.prisma.asset.count({
      where: activeSiteId ? { siteId: activeSiteId } : {},
    });

    // 2. Assets registered in the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const assetsThisWeek = await this.prisma.asset.count({
      where: {
        createdAt: { gte: oneWeekAgo },
        ...(activeSiteId ? { siteId: activeSiteId } : {}),
      }
    });

    // 3. Active Workstation Checkouts
    const activeCheckouts = await this.prisma.asset.count({
      where: {
        status: 'ASSIGNED',
        ...(activeSiteId ? { siteId: activeSiteId } : {}),
      },
    });

    // 4. Pending Request Orders
    const pendingRequestsCount = await this.prisma.request.count({
      where: {
        status: {
          in: ['PENDING_APPROVAL', 'PENDING_OPS_APPROVAL', 'PENDING_PROCUREMENT', 'AWAITING_CONFIRMATION']
        },
        ...(activeSiteId ? { requester: { siteId: activeSiteId } } : {}),
      }
    });

    const awaitingStaffCount = await this.prisma.request.count({
      where: {
        status: 'PENDING_APPROVAL',
        ...(activeSiteId ? { requester: { siteId: activeSiteId } } : {}),
      }
    });

    const awaitingOpsCount = await this.prisma.request.count({
      where: {
        status: 'PENDING_OPS_APPROVAL',
        ...(activeSiteId ? { requester: { siteId: activeSiteId } } : {}),
      }
    });

    // 5. Low-Stock Alerts
    const stocks = await this.prisma.siteStock.findMany({
      where: activeSiteId ? { siteId: activeSiteId } : {},
      include: {
        item: {
          include: { category: true }
        },
        site: true
      }
    });
    
    const lowStockItems = stocks.filter(s => s.quantity <= s.reorderPoint);
    const lowStockAlertsCount = lowStockItems.length;

    const lowStockAlerts = lowStockItems.map(s => ({
      name: s.item.name,
      sku: s.item.sku,
      stock: s.quantity,
      min: s.reorderPoint,
      category: s.item.category?.type === 'CONSUMABLE' ? 'Consumable' : 'Non-Consumable'
    }));

    // 6. Recent Request Transactions
    const dbRecentRequests = await this.prisma.request.findMany({
      where: activeSiteId ? { requester: { siteId: activeSiteId } } : {},
      include: {
        item: {
          include: { category: true }
        },
        requester: {
          include: { site: true }
        },
        approver: true,
        releasedBy: true,
        returnedBy: true,
        receivedBy: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    const recentRequests = dbRecentRequests.map(r => {
      const dto = this.mapRequestToDto(r);
      
      let statusFriendly = 'Pending';
      if (dto.status === 'PENDING') statusFriendly = 'Pending';
      else if (dto.status === 'PENDING_OPS_APPROVAL') statusFriendly = 'Processing';
      else if (dto.status === 'APPROVED') statusFriendly = 'Processing';
      else if (dto.status === 'PENDING_PROCUREMENT') statusFriendly = 'Processing';
      else if (dto.status === 'READY_FOR_PICKUP') statusFriendly = 'Ready';
      else if (dto.status === 'RELEASED') statusFriendly = 'Released';
      else if (dto.status === 'AWAITING_CONFIRMATION') statusFriendly = 'Released';
      else if (dto.status === 'ITEM_RECEIVED') statusFriendly = 'Completed';
      else if (dto.status === 'RETURNED') statusFriendly = 'Completed';
      else if (dto.status === 'REJECTED') statusFriendly = 'Closed';
      else if (dto.status === 'CANCELLED') statusFriendly = 'Closed';

      return {
        id: dto.id,
        item: dto.itemName,
        requester: dto.requestedByName,
        site: dto.siteName || 'Toronto HQ',
        status: statusFriendly,
        date: new Date(dto.createdAt).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
      };
    });

    const utilizationRate = totalAssets > 0 ? Math.round((activeCheckouts / totalAssets) * 100) : 0;

    return {
      metrics: {
        totalAssets,
        assetsThisWeek,
        activeCheckouts,
        utilizationRate,
        pendingRequestsCount,
        awaitingStaffCount,
        awaitingOpsCount,
        lowStockAlertsCount
      },
      recentRequests,
      lowStockAlerts
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
    if (u.role !== 'SUPER_ADMIN' && u.role !== 'ADMIN' && u.role !== 'INVENTORY_STAFF') {
      throw new ForbiddenException('Only Super Admin, Ops Manager, and Inventory Staff can perform staff approval.');
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
    if (u.role !== 'SUPER_ADMIN' && u.role !== 'ADMIN' && u.role !== 'INVENTORY_STAFF') {
      throw new ForbiddenException('Only Super Admin, Ops Manager, and Inventory Staff can perform ops approval.');
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
    if (u.role !== 'SUPER_ADMIN' && u.role !== 'ADMIN' && u.role !== 'INVENTORY_STAFF') {
      throw new ForbiddenException('Only Super Admin, Ops Manager, and Inventory Staff can prepare/stage items for pickup.');
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
    if (u && u.role !== 'SUPER_ADMIN' && u.role !== 'ADMIN' && u.role !== 'INVENTORY_STAFF') {
      throw new BadRequestException('Unauthorized role for releasing requests.');
    }
    const req = await this.prisma.request.findUnique({
      where: { id },
      include: {
        item: {
          include: { category: true }
        },
        requester: true
      }
    });
    if (!req) throw new NotFoundException('Request not found');

    if (req.status !== 'READY_FOR_PICKUP') {
      throw new BadRequestException('Cannot release a request that is not ready for pickup.');
    }

    if (u && u.id === req.requesterId) {
      throw new BadRequestException('A user cannot release their own request.');
    }

    return await this.prisma.$transaction(async (tx) => {
      const isConsumable = req.item?.category?.type === 'CONSUMABLE';
      if (isConsumable) {
        const updatedReq = await tx.request.update({
          where: { id },
          data: {
            status: 'AWAITING_CONFIRMATION',
            releasedById: u ? u.id : undefined,
            releasedAt: new Date(),
            assetId: null,
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
            }
          },
          include: this.requestInclude
        });
        return this.mapRequestToDto(updatedReq);
      }

      let asset = null;
      if (assetId) {
        asset = await tx.asset.findFirst({
          where: {
            OR: [
              { tagCode: assetId },
              { barcode: assetId },
              { id: assetId }
            ]
          },
          include: { item: true }
        });
      } else {
        asset = await tx.asset.findFirst({
          where: {
            itemId: req.itemId,
            status: 'AVAILABLE',
            condition: { notIn: ['BAD', 'DAMAGED'] }
          },
          include: { item: true }
        });
        if (!asset && req.item?.categoryId) {
          asset = await tx.asset.findFirst({
            where: {
              item: {
                categoryId: req.item.categoryId
              },
              status: 'AVAILABLE',
              condition: { notIn: ['BAD', 'DAMAGED'] }
            },
            include: { item: true }
          });
        }
      }

      if (!asset) {
        // Parse siteId from the purpose JSON since it's not a direct column
        let releaseSiteId: string | undefined;
        try {
          const purposeData = JSON.parse(req.purpose || '{}');
          releaseSiteId = purposeData.siteId;
        } catch { /* ignore parse errors */ }
        releaseSiteId = releaseSiteId || req.requester?.siteId || undefined;

        const site = (releaseSiteId ? await tx.site.findFirst({ where: { id: releaseSiteId } }) : null) || await tx.site.findFirst();
        const category = await tx.assetCategory.findUnique({ where: { id: req.item.categoryId } });
        const actualSitePrefix = (site?.prefix || "SYS").toUpperCase();
        const actualCategoryPrefix = (category?.prefix || "AST").toUpperCase();
        const assetTagPrefix = `${actualSitePrefix}-${actualCategoryPrefix}-`;

        const matchingAssets = await tx.asset.findMany({
          where: { tagCode: { contains: `-${actualCategoryPrefix}-` } },
          select: { tagCode: true },
        });

        let assetNum = 1;
        if (matchingAssets.length > 0) {
          const numbers = matchingAssets.map((asset) => {
            const parts = asset.tagCode.split("-");
            const numStr = parts[parts.length - 1];
            const num = parseInt(numStr, 10);
            return isNaN(num) ? 0 : num;
          });
          assetNum = Math.max(...numbers, 0) + 1;
        }

        let tagCode = "";
        let isUnique = false;
        while (!isUnique) {
          tagCode = `${assetTagPrefix}${String(assetNum).padStart(4, "0")}`;
          const duplicate = await tx.asset.findUnique({
            where: { tagCode },
          });
          if (!duplicate) {
            isUnique = true;
          }
          assetNum++;
        }

        const serialNumber = `SN-${tagCode}`;

        asset = await tx.asset.create({
          data: {
            itemId: req.itemId,
            siteId: site ? site.id : 'default-site',
            status: "AVAILABLE",
            condition: "GOOD",
            tagCode,
            serialNumber,
          },
          include: { item: true, site: true }
        });
      }
      if (asset.itemId !== req.itemId && asset.item.categoryId !== req.item.categoryId) {
        throw new BadRequestException(`Asset Tag '${asset.tagCode}' does not match the requested item type or category.`);
      }
      if (asset.status !== 'AVAILABLE') {
        throw new BadRequestException(`Asset Tag '${asset.tagCode}' is already checked out or unavailable. Please use a different tag.`);
      }
      asset = await tx.asset.update({
        where: { id: asset.id },
        data: { status: 'ASSIGNED', assignedToId: req.requesterId }
      });

      let releaseSiteId = asset.siteId || req.requester?.siteId;
      if (!releaseSiteId && req.purpose) {
        try {
          const parsed = JSON.parse(req.purpose);
          releaseSiteId = parsed.siteId;
        } catch {}
      }
      if (releaseSiteId) {
        let relQty = 1;
        try {
          if (req.purpose && req.purpose.startsWith('{')) {
            const parsed = JSON.parse(req.purpose);
            relQty = parsed.quantity || 1;
          }
        } catch {}

        const stock = await tx.siteStock.findFirst({
          where: { siteId: releaseSiteId, itemId: req.itemId }
        });
        if (stock) {
          await tx.siteStock.update({
            where: { id: stock.id },
            data: { quantity: { decrement: relQty } }
          });
        }
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
    if (currentReq.status !== 'PENDING_APPROVAL' && currentReq.status !== 'PENDING_OPS_APPROVAL' && currentReq.status !== 'APPROVED' && currentReq.status !== 'READY_FOR_PICKUP') {
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
      where: { id },
      include: { requester: true, asset: true }
    });
    if (!r) return null;

    const isDeployment = r.purpose && r.purpose.includes('[ASSET DEPLOYMENT]');
    if (r.status !== 'RELEASED' && r.status !== 'AWAITING_CONFIRMATION' && r.status !== 'ITEM_RECEIVED' && !isDeployment) {
      throw new BadRequestException(`Cannot return a request that is currently ${r.status}.`);
    }

    let adminUser = null;
    if (returnerEmail) {
      adminUser = await this.prisma.user.findUnique({ where: { email: returnerEmail } });
      if (adminUser && adminUser.role !== 'SUPER_ADMIN' && adminUser.role !== 'ADMIN' && adminUser.role !== 'INVENTORY_STAFF') {
        throw new BadRequestException('Unauthorized role for processing returns.');
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
      const commentLower = (returnComment || '').toLowerCase();
      const isDamaged = commentLower.includes('bad') || commentLower.includes('damaged') || commentLower.includes('missing');
      await this.prisma.asset.update({
        where: { id: r.assetId },
        data: {
          status: isDamaged ? 'UNDER_MAINTENANCE' : 'AVAILABLE',
          condition: isDamaged ? 'DAMAGED' : 'GOOD',
          assignedToId: null
        }
      });
    }

    // Automatically update in the asset catalog (SiteStock level)
    let siteId = r.asset?.siteId || r.requester?.siteId;
    if (!siteId && r.purpose) {
      try {
        const parsed = JSON.parse(r.purpose);
        siteId = parsed.siteId;
      } catch {}
    }
    if (siteId) {
      let quantity = 1;
      try {
        if (r.purpose && r.purpose.startsWith('{')) {
          const parsed = JSON.parse(r.purpose);
          quantity = parsed.quantity || 1;
        }
      } catch {}

      const stock = await this.prisma.siteStock.findFirst({
        where: {
          siteId: siteId,
          itemId: r.itemId
        }
      });

      if (stock) {
        await this.prisma.siteStock.update({
          where: { id: stock.id },
          data: { quantity: { increment: quantity } }
        });
      } else {
        await this.prisma.siteStock.create({
          data: {
            siteId: siteId,
            itemId: r.itemId,
            quantity: quantity
          }
        });
      }
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

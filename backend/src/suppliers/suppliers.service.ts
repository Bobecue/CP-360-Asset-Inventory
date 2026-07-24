import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateSupplierId(): Promise<string> {
    const count = await this.prisma.supplier.count();
    let num = count + 1;
    let code = `SUP-${String(num).padStart(4, "0")}`;
    let exists = await this.prisma.supplier.findFirst({ where: { supplierId: code } });
    while (exists) {
      num++;
      code = `SUP-${String(num).padStart(4, "0")}`;
      exists = await this.prisma.supplier.findFirst({ where: { supplierId: code } });
    }
    return code;
  }

  async seedDefaultSuppliersIfNeeded() {
    // Disabled auto-seeding to allow fresh empty supplier list
    const unassigned = await this.prisma.supplier.findMany({ where: { supplierId: null } });
    for (let i = 0; i < unassigned.length; i++) {
      const sup = unassigned[i];
      const code = await this.generateSupplierId();
      await this.prisma.supplier.update({
        where: { id: sup.id },
        data: { supplierId: code },
      });
    }
  }

  async findAll(search?: string) {
    await this.seedDefaultSuppliersIfNeeded();

    let whereClause: any = {};
    if (search && search.trim() !== "") {
      const q = search.trim();
      whereClause = {
        OR: [
          { supplierId: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
          { contactPerson: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { province: { contains: q, mode: "insensitive" } },
          { country: { contains: q, mode: "insensitive" } },
        ],
      };
    }

    const suppliers = await this.prisma.supplier.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            assets: true,
            items: true,
            purchaseOrders: true,
          },
        },
        assets: {
          include: {
            item: true,
            site: true,
          },
        },
        items: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return suppliers;
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assets: true,
            purchaseOrders: true,
          },
        },
        assets: {
          include: {
            item: {
              include: {
                category: true,
              },
            },
            site: true,
            assignedTo: true,
          },
        },
        purchaseOrders: true,
      },
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found.`);
    }

    return supplier;
  }

  async create(data: {
    supplierId?: string;
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    province?: string;
    country?: string;
    leadTimeDays?: number;
  }) {
    if (!data.name || data.name.trim() === "") {
      throw new BadRequestException("Supplier Name is required.");
    }

    const existingName = await this.prisma.supplier.findUnique({
      where: { name: data.name.trim() },
    });
    if (existingName) {
      throw new BadRequestException(`Supplier with name "${data.name}" already exists.`);
    }

    let code = data.supplierId ? data.supplierId.trim() : "";
    if (code) {
      const existingCode = await this.prisma.supplier.findFirst({
        where: { supplierId: code },
      });
      if (existingCode) {
        throw new BadRequestException(`Supplier ID "${code}" already exists.`);
      }
    } else {
      code = await this.generateSupplierId();
    }

    const supplier = await this.prisma.supplier.create({
      data: {
        supplierId: code,
        name: data.name.trim(),
        contactPerson: data.contactPerson?.trim() || null,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        province: data.province?.trim() || null,
        country: data.country?.trim() || "Philippines",
        leadTimeDays: data.leadTimeDays ? Number(data.leadTimeDays) : 7,
      },
    });

    return supplier;
  }

  async update(
    id: string,
    data: {
      supplierId?: string;
      name?: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      province?: string;
      country?: string;
      leadTimeDays?: number;
    }
  ) {
    const existing = await this.prisma.supplier.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Supplier with ID ${id} not found.`);
    }

    if (data.name && data.name.trim() !== existing.name) {
      const nameConflict = await this.prisma.supplier.findUnique({
        where: { name: data.name.trim() },
      });
      if (nameConflict) {
        throw new BadRequestException(`Supplier with name "${data.name}" already exists.`);
      }
    }

    if (data.supplierId && data.supplierId.trim() !== existing.supplierId) {
      const codeConflict = await this.prisma.supplier.findUnique({
        where: { supplierId: data.supplierId.trim() },
      });
      if (codeConflict) {
        throw new BadRequestException(`Supplier ID "${data.supplierId}" already exists.`);
      }
    }

    const updated = await this.prisma.supplier.update({
      where: { id },
      data: {
        supplierId: data.supplierId !== undefined ? (data.supplierId ? data.supplierId.trim() : null) : existing.supplierId,
        name: data.name !== undefined ? data.name.trim() : existing.name,
        contactPerson: data.contactPerson !== undefined ? (data.contactPerson ? data.contactPerson.trim() : null) : existing.contactPerson,
        email: data.email !== undefined ? (data.email ? data.email.trim() : null) : existing.email,
        phone: data.phone !== undefined ? (data.phone ? data.phone.trim() : null) : existing.phone,
        address: data.address !== undefined ? (data.address ? data.address.trim() : null) : existing.address,
        city: data.city !== undefined ? (data.city ? data.city.trim() : null) : existing.city,
        province: data.province !== undefined ? (data.province ? data.province.trim() : null) : existing.province,
        country: data.country !== undefined ? (data.country ? data.country.trim() : null) : existing.country,
        leadTimeDays: data.leadTimeDays !== undefined ? Number(data.leadTimeDays) : existing.leadTimeDays,
      },
    });

    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { purchaseOrders: true, assets: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Supplier with ID ${id} not found.`);
    }

    if (existing._count.purchaseOrders > 0) {
      throw new BadRequestException(
        `Cannot delete supplier because it is associated with ${existing._count.purchaseOrders} purchase order(s).`
      );
    }

    // Unlink assets from supplier before delete if any
    if (existing._count.assets > 0) {
      await this.prisma.asset.updateMany({
        where: { supplierId: id },
        data: { supplierId: null },
      });
    }

    await this.prisma.supplier.delete({ where: { id } });
    return { message: "Supplier deleted successfully", statusCode: 200 };
  }

  async assignAssets(supplierId: string, assetIds: string[]) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${supplierId} not found.`);
    }

    // Set supplierId for specified assets
    await this.prisma.asset.updateMany({
      where: {
        id: { in: assetIds },
      },
      data: {
        supplierId: supplier.id,
      },
    });

    return this.findOne(supplierId);
  }

  async removeAssetSupplier(assetId: string) {
    const asset = await this.prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found.`);
    }

    await this.prisma.asset.update({
      where: { id: assetId },
      data: { supplierId: null },
    });

    return { message: "Asset unassigned from supplier successfully", statusCode: 200 };
  }

  async getAssignableAssets() {
    return this.prisma.asset.findMany({
      include: {
        item: {
          include: {
            category: true,
          },
        },
        site: true,
        supplier: true,
      },
      orderBy: { tagCode: "asc" },
    });
  }
}

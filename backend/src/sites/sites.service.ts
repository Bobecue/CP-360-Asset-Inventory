import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SitesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.site.findMany({
      orderBy: { name: "asc" },
    });
  }

  async create(data: { name: string; prefix: string; address?: string }) {
    // Check conflicts
    const existingName = await this.prisma.site.findUnique({
      where: { name: data.name },
    });
    if (existingName) {
      throw new ConflictException("A site with this name already exists.");
    }

    const existingPrefix = await this.prisma.site.findUnique({
      where: { prefix: data.prefix.toUpperCase() },
    });
    if (existingPrefix) {
      throw new ConflictException("A site with this prefix already exists.");
    }

    return this.prisma.site.create({
      data: {
        name: data.name,
        prefix: data.prefix.toUpperCase(),
        address: data.address || null,
      },
    });
  }

  async update(id: string, data: { name?: string; prefix?: string; address?: string }) {
    const site = await this.prisma.site.findUnique({ where: { id } });
    if (!site) {
      throw new NotFoundException("Site not found.");
    }

    if (data.name) {
      const existingName = await this.prisma.site.findUnique({
        where: { name: data.name },
      });
      if (existingName && existingName.id !== id) {
        throw new ConflictException("A site with this name already exists.");
      }
    }

    if (data.prefix) {
      const existingPrefix = await this.prisma.site.findUnique({
        where: { prefix: data.prefix.toUpperCase() },
      });
      if (existingPrefix && existingPrefix.id !== id) {
        throw new ConflictException("A site with this prefix already exists.");
      }
    }

    return this.prisma.site.update({
      where: { id },
      data: {
        name: data.name,
        prefix: data.prefix ? data.prefix.toUpperCase() : undefined,
        address: data.address !== undefined ? (data.address || null) : undefined,
      },
    });
  }

  async remove(id: string) {
    const site = await this.prisma.site.findUnique({ where: { id } });
    if (!site) {
      throw new NotFoundException("Site not found.");
    }

    // Check if site is referenced by users or assets
    const usersCount = await this.prisma.user.count({ where: { siteId: id } });
    if (usersCount > 0) {
      throw new ConflictException("Cannot delete site as it is currently assigned to user accounts.");
    }

    const assetsCount = await this.prisma.asset.count({ where: { siteId: id } });
    if (assetsCount > 0) {
      throw new ConflictException("Cannot delete site as it is currently associated with physical assets.");
    }

    return this.prisma.site.delete({ where: { id } });
  }
}

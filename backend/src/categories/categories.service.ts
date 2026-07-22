import { Injectable, ConflictException, NotFoundException, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CategoryType } from "@prisma/client";

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const defaultCategories = [
      { name: "Laptops", prefix: "LAP", type: CategoryType.NON_CONSUMABLE, description: "Laptops, MacBooks, and Notebooks" },
      { name: "Monitors", prefix: "MON", type: CategoryType.NON_CONSUMABLE, description: "Desktop monitors and displays" },
      { name: "System Units", prefix: "SYS", type: CategoryType.NON_CONSUMABLE, description: "Desktop PCs, System Units, and Workstations" },
      { name: "RAM", prefix: "RAM", type: CategoryType.NON_CONSUMABLE, description: "Memory modules and RAM sticks" },
      { name: "SSD / Storage", prefix: "SSD", type: CategoryType.NON_CONSUMABLE, description: "Solid State Drives and hard drives" },
      { name: "Keyboards", prefix: "KBD", type: CategoryType.CONSUMABLE, description: "Keyboards and keypads" },
      { name: "Mice", prefix: "MOU", type: CategoryType.CONSUMABLE, description: "Computer mice and pointers" },
      { name: "Cables", prefix: "CAB", type: CategoryType.CONSUMABLE, description: "Cables, adapters, and power cords" },
    ];

    for (const cat of defaultCategories) {
      await this.prisma.assetCategory.upsert({
        where: { prefix: cat.prefix },
        update: { type: cat.type, name: cat.name },
        create: cat,
      });
    }
  }

  async findAll() {
    return this.prisma.assetCategory.findMany({
      orderBy: { name: "asc" },
    });
  }

  async create(data: { name: string; prefix: string; type: CategoryType; description?: string }) {
    // Check conflicts
    const existingName = await this.prisma.assetCategory.findUnique({
      where: { name: data.name },
    });
    if (existingName) {
      throw new ConflictException("A category with this name already exists.");
    }

    const existingPrefix = await this.prisma.assetCategory.findUnique({
      where: { prefix: data.prefix.toUpperCase() },
    });
    if (existingPrefix) {
      throw new ConflictException("A category with this prefix already exists.");
    }

    return this.prisma.assetCategory.create({
      data: {
        name: data.name,
        prefix: data.prefix.toUpperCase(),
        type: data.type,
        description: data.description || null,
      },
    });
  }

  async update(id: string, data: { name?: string; prefix?: string; type?: CategoryType; description?: string }) {
    const category = await this.prisma.assetCategory.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException("Category not found.");
    }

    if (data.name) {
      const existingName = await this.prisma.assetCategory.findUnique({
        where: { name: data.name },
      });
      if (existingName && existingName.id !== id) {
        throw new ConflictException("A category with this name already exists.");
      }
    }

    if (data.prefix) {
      const existingPrefix = await this.prisma.assetCategory.findUnique({
        where: { prefix: data.prefix.toUpperCase() },
      });
      if (existingPrefix && existingPrefix.id !== id) {
        throw new ConflictException("A category with this prefix already exists.");
      }
    }

    return this.prisma.assetCategory.update({
      where: { id },
      data: {
        name: data.name,
        prefix: data.prefix ? data.prefix.toUpperCase() : undefined,
        type: data.type,
        description: data.description !== undefined ? (data.description || null) : undefined,
      },
    });
  }

  async remove(id: string) {
    const category = await this.prisma.assetCategory.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException("Category not found.");
    }

    // Check if category contains items
    const itemsCount = await this.prisma.item.count({ where: { categoryId: id } });
    if (itemsCount > 0) {
      throw new ConflictException("Cannot delete category as it is currently associated with catalog items.");
    }

    return this.prisma.assetCategory.delete({ where: { id } });
  }
}

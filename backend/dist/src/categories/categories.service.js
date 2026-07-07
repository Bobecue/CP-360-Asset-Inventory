"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CategoriesService = class CategoriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.assetCategory.findMany({
            orderBy: { name: "asc" },
        });
    }
    async create(data) {
        const existingName = await this.prisma.assetCategory.findUnique({
            where: { name: data.name },
        });
        if (existingName) {
            throw new common_1.ConflictException("A category with this name already exists.");
        }
        const existingPrefix = await this.prisma.assetCategory.findUnique({
            where: { prefix: data.prefix.toUpperCase() },
        });
        if (existingPrefix) {
            throw new common_1.ConflictException("A category with this prefix already exists.");
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
    async update(id, data) {
        const category = await this.prisma.assetCategory.findUnique({ where: { id } });
        if (!category) {
            throw new common_1.NotFoundException("Category not found.");
        }
        if (data.name) {
            const existingName = await this.prisma.assetCategory.findUnique({
                where: { name: data.name },
            });
            if (existingName && existingName.id !== id) {
                throw new common_1.ConflictException("A category with this name already exists.");
            }
        }
        if (data.prefix) {
            const existingPrefix = await this.prisma.assetCategory.findUnique({
                where: { prefix: data.prefix.toUpperCase() },
            });
            if (existingPrefix && existingPrefix.id !== id) {
                throw new common_1.ConflictException("A category with this prefix already exists.");
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
    async remove(id) {
        const category = await this.prisma.assetCategory.findUnique({ where: { id } });
        if (!category) {
            throw new common_1.NotFoundException("Category not found.");
        }
        const itemsCount = await this.prisma.item.count({ where: { categoryId: id } });
        if (itemsCount > 0) {
            throw new common_1.ConflictException("Cannot delete category as it is currently associated with catalog items.");
        }
        return this.prisma.assetCategory.delete({ where: { id } });
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map
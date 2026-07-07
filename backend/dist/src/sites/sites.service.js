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
exports.SitesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SitesService = class SitesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.site.findMany({
            orderBy: { name: "asc" },
        });
    }
    async create(data) {
        const existingName = await this.prisma.site.findUnique({
            where: { name: data.name },
        });
        if (existingName) {
            throw new common_1.ConflictException("A site with this name already exists.");
        }
        const existingPrefix = await this.prisma.site.findUnique({
            where: { prefix: data.prefix.toUpperCase() },
        });
        if (existingPrefix) {
            throw new common_1.ConflictException("A site with this prefix already exists.");
        }
        return this.prisma.site.create({
            data: {
                name: data.name,
                prefix: data.prefix.toUpperCase(),
                address: data.address || null,
            },
        });
    }
    async update(id, data) {
        const site = await this.prisma.site.findUnique({ where: { id } });
        if (!site) {
            throw new common_1.NotFoundException("Site not found.");
        }
        if (data.name) {
            const existingName = await this.prisma.site.findUnique({
                where: { name: data.name },
            });
            if (existingName && existingName.id !== id) {
                throw new common_1.ConflictException("A site with this name already exists.");
            }
        }
        if (data.prefix) {
            const existingPrefix = await this.prisma.site.findUnique({
                where: { prefix: data.prefix.toUpperCase() },
            });
            if (existingPrefix && existingPrefix.id !== id) {
                throw new common_1.ConflictException("A site with this prefix already exists.");
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
    async remove(id) {
        const site = await this.prisma.site.findUnique({ where: { id } });
        if (!site) {
            throw new common_1.NotFoundException("Site not found.");
        }
        const usersCount = await this.prisma.user.count({ where: { siteId: id } });
        if (usersCount > 0) {
            throw new common_1.ConflictException("Cannot delete site as it is currently assigned to user accounts.");
        }
        const assetsCount = await this.prisma.asset.count({ where: { siteId: id } });
        if (assetsCount > 0) {
            throw new common_1.ConflictException("Cannot delete site as it is currently associated with physical assets.");
        }
        return this.prisma.site.delete({ where: { id } });
    }
};
exports.SitesService = SitesService;
exports.SitesService = SitesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SitesService);
//# sourceMappingURL=sites.service.js.map
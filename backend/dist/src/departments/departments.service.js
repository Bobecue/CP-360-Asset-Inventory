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
exports.DepartmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DepartmentsService = class DepartmentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.department.findMany({
            orderBy: { name: "asc" },
        });
    }
    async create(data) {
        const existingName = await this.prisma.department.findUnique({
            where: { name: data.name },
        });
        if (existingName) {
            throw new common_1.ConflictException("A department with this name already exists.");
        }
        return this.prisma.department.create({
            data: {
                name: data.name,
            },
        });
    }
    async remove(id) {
        const dept = await this.prisma.department.findUnique({ where: { id } });
        if (!dept) {
            throw new common_1.NotFoundException("Department not found.");
        }
        const usersCount = await this.prisma.user.count({ where: { department: dept.name } });
        if (usersCount > 0) {
            throw new common_1.ConflictException("Cannot delete department as it is currently assigned to user accounts.");
        }
        return this.prisma.department.delete({ where: { id } });
    }
};
exports.DepartmentsService = DepartmentsService;
exports.DepartmentsService = DepartmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DepartmentsService);
//# sourceMappingURL=departments.service.js.map
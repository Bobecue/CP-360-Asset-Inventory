import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.department.findMany({
      orderBy: { name: "asc" },
    });
  }

  async create(data: { name: string }) {
    const existingName = await this.prisma.department.findUnique({
      where: { name: data.name },
    });
    if (existingName) {
      throw new ConflictException("A department with this name already exists.");
    }

    return this.prisma.department.create({
      data: {
        name: data.name,
      },
    });
  }

  async remove(id: string) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) {
      throw new NotFoundException("Department not found.");
    }

    // Check if department is used by users. Since department is stored as a string field in User model,
    // we check if any user has this department name.
    const usersCount = await this.prisma.user.count({ where: { department: dept.name } });
    if (usersCount > 0) {
      throw new ConflictException("Cannot delete department as it is currently assigned to user accounts.");
    }

    return this.prisma.department.delete({ where: { id } });
  }
}

import { Injectable, UnauthorizedException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        employeeId: true,
        department: true,
        role: true,
        isActive: true,
        siteId: true,
        site: {
          select: {
            id: true,
            name: true,
            prefix: true,
          }
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async create(data: {
    email: string;
    name: string;
    passwordPlain?: string;
    role: Role;
    employeeId?: string;
    department?: string;
    siteId?: string;
  }) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.passwordPlain || "SuperAdmin360!", salt);

    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name,
        passwordHash,
        role: data.role,
        employeeId: data.employeeId || null,
        department: data.department || null,
        siteId: data.siteId || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        employeeId: true,
        department: true,
        role: true,
        isActive: true,
        siteId: true,
        site: {
          select: {
            id: true,
            name: true,
            prefix: true,
          }
        },
        createdAt: true,
      },
    });
  }

  async login(email: string, passwordPlain: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            prefix: true,
          }
        }
      }
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials. Please try again.");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("This account is inactive. Please contact support.");
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException("Invalid credentials. Please try again.");
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async update(
    id: string,
    data: {
      email?: string;
      name?: string;
      role?: Role;
      employeeId?: string;
      department?: string;
      isActive?: boolean;
      siteId?: string;
    },
  ) {
    // Prevent deactivating the primary Super Admin
    if (data.isActive === false) {
      const userToDeactivate = await this.prisma.user.findUnique({
        where: { id },
      });
      if (userToDeactivate && userToDeactivate.email === "superadmin@contactpoint360.com") {
        throw new Error("The primary Super Admin user account cannot be deactivated.");
      }
    }

    // Email conflict check
    if (data.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser && existingUser.id !== id) {
        throw new Error("A user account with this email address already exists.");
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        email: data.email ? data.email.toLowerCase() : undefined,
        name: data.name,
        role: data.role,
        employeeId: data.employeeId !== undefined ? (data.employeeId || null) : undefined,
        department: data.department !== undefined ? (data.department || null) : undefined,
        siteId: data.siteId !== undefined ? (data.siteId || null) : undefined,
        isActive: data.isActive,
      },
      select: {
        id: true,
        email: true,
        name: true,
        employeeId: true,
        department: true,
        role: true,
        isActive: true,
        siteId: true,
        site: {
          select: {
            id: true,
            name: true,
            prefix: true,
          }
        },
        createdAt: true,
      },
    });
  }
}

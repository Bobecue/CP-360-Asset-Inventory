import { PrismaService } from "../prisma/prisma.service";
import { Role } from "@prisma/client";
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        site: {
            id: string;
            name: string;
            prefix: string;
        } | null;
        department: string | null;
        id: string;
        createdAt: Date;
        siteId: string | null;
        email: string;
        employeeId: string | null;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
    }[]>;
    create(data: {
        email: string;
        name: string;
        passwordPlain?: string;
        role: Role;
        employeeId?: string;
        department?: string;
        siteId?: string;
    }): Promise<{
        site: {
            id: string;
            name: string;
            prefix: string;
        } | null;
        department: string | null;
        id: string;
        createdAt: Date;
        siteId: string | null;
        email: string;
        employeeId: string | null;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
    }>;
    login(email: string, passwordPlain: string): Promise<{
        site: {
            id: string;
            name: string;
            prefix: string;
        } | null;
        department: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        siteId: string | null;
        email: string;
        employeeId: string | null;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
    }>;
    update(id: string, data: {
        email?: string;
        name?: string;
        role?: Role;
        employeeId?: string;
        department?: string;
        isActive?: boolean;
        siteId?: string;
    }): Promise<{
        site: {
            id: string;
            name: string;
            prefix: string;
        } | null;
        department: string | null;
        id: string;
        createdAt: Date;
        siteId: string | null;
        email: string;
        employeeId: string | null;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        isActive: boolean;
    }>;
}

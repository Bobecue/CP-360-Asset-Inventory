import { UsersService } from "./users.service";
import { Role } from "@prisma/client";
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getAllUsers(): Promise<{
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
    login(body: {
        email: string;
        passwordPlain: string;
    }): Promise<{
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
    createUser(body: {
        email: string;
        name: string;
        passwordPlain: string;
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
    updateUser(id: string, body: {
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

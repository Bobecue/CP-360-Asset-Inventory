import { PrismaService } from "../prisma/prisma.service";
import { CategoryType } from "@prisma/client";
export declare class CategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        prefix: string;
        type: import("@prisma/client").$Enums.CategoryType;
    }[]>;
    create(data: {
        name: string;
        prefix: string;
        type: CategoryType;
        description?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        prefix: string;
        type: import("@prisma/client").$Enums.CategoryType;
    }>;
    update(id: string, data: {
        name?: string;
        prefix?: string;
        type?: CategoryType;
        description?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        prefix: string;
        type: import("@prisma/client").$Enums.CategoryType;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        prefix: string;
        type: import("@prisma/client").$Enums.CategoryType;
    }>;
}

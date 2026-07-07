import { CategoriesService } from "./categories.service";
import { CategoryType } from "@prisma/client";
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    getAllCategories(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        prefix: string;
        type: import("@prisma/client").$Enums.CategoryType;
    }[]>;
    createCategory(body: {
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
    updateCategory(id: string, body: {
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
    deleteCategory(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        prefix: string;
        type: import("@prisma/client").$Enums.CategoryType;
    }>;
}

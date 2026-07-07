import { PrismaService } from "../prisma/prisma.service";
export declare class SitesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        prefix: string;
        address: string | null;
    }[]>;
    create(data: {
        name: string;
        prefix: string;
        address?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        prefix: string;
        address: string | null;
    }>;
    update(id: string, data: {
        name?: string;
        prefix?: string;
        address?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        prefix: string;
        address: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        prefix: string;
        address: string | null;
    }>;
}

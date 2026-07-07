import { PrismaService } from '../prisma/prisma.service';
export declare class AssetsService {
    private prisma;
    constructor(prisma: PrismaService);
    getHistory(tagCode: string): Promise<{
        asset: {
            id: string;
            serialNumber: string;
            tagCode: string;
            barcode: string | null;
            status: import("@prisma/client").$Enums.AssetStatus;
            condition: string | null;
            createdAt: Date;
            updatedAt: Date;
            itemId: string;
            siteId: string;
            assignedToId: string | null;
        };
        history: ({
            user: {
                name: string;
                role: import("@prisma/client").$Enums.Role;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            assetId: string;
            action: string;
            details: string | null;
            userId: string | null;
            requestId: string | null;
        })[];
    }>;
}

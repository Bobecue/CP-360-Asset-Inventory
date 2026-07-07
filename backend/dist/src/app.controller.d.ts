import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
export declare class AppController {
    private readonly appService;
    private readonly prisma;
    constructor(appService: AppService, prisma: PrismaService);
    getHello(): string;
    getItems(): Promise<{
        id: string;
        name: string;
        sku: string;
        stock: number;
        category: string;
    }[]>;
}

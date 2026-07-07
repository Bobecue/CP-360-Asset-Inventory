import { OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private static pool;
    private static adapter;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}

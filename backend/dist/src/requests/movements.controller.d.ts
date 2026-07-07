import type { Response } from "express";
import { RequestsService } from "./requests.service";
export declare class MovementsController {
    private readonly requestsService;
    constructor(requestsService: RequestsService);
    private generatePdfInWorker;
    exportPdf(body: any, res: Response): Promise<void>;
    confirmReceipt(id: string, req: any): Promise<{
        data: import("./requests.service").Req;
        message: string;
        statusCode: number;
    }>;
    approveStaff(id: string, body: any, req: any): Promise<{
        data: import("./requests.service").Req;
        message: string;
        statusCode: number;
    }>;
    approveOps(id: string, body: any, req: any): Promise<{
        data: import("./requests.service").Req;
        message: string;
        statusCode: number;
    }>;
    preparePickup(id: string, body: any, req: any): Promise<{
        data: import("./requests.service").Req;
        message: string;
        statusCode: number;
    }>;
}

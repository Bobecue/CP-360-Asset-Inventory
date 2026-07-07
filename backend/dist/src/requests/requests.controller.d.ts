import { RequestsService } from "./requests.service";
export declare class RequestsController {
    private svc;
    constructor(svc: RequestsService);
    create(body: any, req: any): Promise<{
        data: import("./requests.service").Req;
        message: string;
        statusCode: number;
    }>;
    findAll(req: any): Promise<{
        data: import("./requests.service").Req[];
        message: string;
        statusCode: number;
    }>;
    getSummary(req: any): Promise<{
        data: {
            pending: number;
            approvedThisMonth: number;
            rejectedThisMonth: number;
            avgApprovalDays: number;
            pendingDelta: number;
            urgencyBreakdown: {
                CRITICAL: number;
                HIGH: number;
                NORMAL: number;
                LOW: number;
            };
            latestPending: {
                id: string;
                itemName: string;
                requestedBy: string;
                site: string;
                quantity: number;
                urgency: "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
                createdAt: string;
            }[];
        };
        message: string;
        statusCode: number;
    }>;
    findMine(req: any): Promise<{
        data: {
            items: import("./requests.service").Req[];
            pendingCount: number;
        };
        message: string;
        statusCode: number;
    }>;
    findOne(id: string): Promise<{
        data: import("./requests.service").Req | null;
        message: string;
        statusCode: number;
    }>;
    approve(id: string, body: any): Promise<{
        data: void;
        message: string;
        statusCode: number;
    }>;
    reject(id: string, body: any): Promise<{
        data: import("./requests.service").Req;
        message: string;
        statusCode: number;
    }>;
    release(id: string, body: any): Promise<{
        data: import("./requests.service").Req;
        message: string;
        statusCode: number;
    }>;
    returnAsset(id: string, body: any): Promise<{
        data: import("./requests.service").Req | null;
        message: string;
        statusCode: number;
    }>;
    review(id: string, body: {
        status: "APPROVED" | "REJECTED";
        reviewComment?: string;
        approverEmail?: string;
    }): Promise<{
        data: void;
        message: string;
        statusCode: number;
    } | {
        data: import("./requests.service").Req;
        message: string;
        statusCode: number;
    }>;
    cancel(id: string): Promise<{
        data: import("./requests.service").Req;
        message: string;
        statusCode: number;
    }>;
    addComment(id: string, body: {
        comment: string;
    }, req: any): Promise<{
        data: import("./requests.service").Req;
        message: string;
        statusCode: number;
    }>;
}

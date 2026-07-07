import { SitesService } from "./sites.service";
export declare class SitesController {
    private readonly sitesService;
    constructor(sitesService: SitesService);
    getAllSites(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        prefix: string;
        address: string | null;
    }[]>;
    createSite(body: {
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
    updateSite(id: string, body: {
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
    deleteSite(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        prefix: string;
        address: string | null;
    }>;
}

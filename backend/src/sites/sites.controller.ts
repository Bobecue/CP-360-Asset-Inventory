import { Controller, Get, Post, Patch, Delete, Body, Param } from "@nestjs/common";
import { SitesService } from "./sites.service";

@Controller("sites")
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Get()
  async getAllSites() {
    return this.sitesService.findAll();
  }

  @Post()
  async createSite(
    @Body()
    body: {
      name: string;
      prefix: string;
      address?: string;
    },
  ) {
    return this.sitesService.create(body);
  }

  @Patch(":id")
  async updateSite(
    @Param("id") id: string,
    @Body()
    body: {
      name?: string;
      prefix?: string;
      address?: string;
    },
  ) {
    return this.sitesService.update(id, body);
  }

  @Delete(":id")
  async deleteSite(@Param("id") id: string) {
    return this.sitesService.remove(id);
  }
}

import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from "@nestjs/common";
import { SuppliersService } from "./suppliers.service";

@Controller("suppliers")
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  async getAllSuppliers(@Query("search") search?: string) {
    const data = await this.suppliersService.findAll(search);
    return { data, message: "Suppliers fetched successfully", statusCode: 200 };
  }

  @Get("assignable-assets")
  async getAssignableAssets() {
    const data = await this.suppliersService.getAssignableAssets();
    return { data, message: "Assignable assets fetched successfully", statusCode: 200 };
  }

  @Get(":id")
  async getSupplierById(@Param("id") id: string) {
    const data = await this.suppliersService.findOne(id);
    return { data, message: "Supplier details fetched successfully", statusCode: 200 };
  }

  @Post()
  async createSupplier(
    @Body()
    body: {
      supplierId?: string;
      name: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      province?: string;
      country?: string;
      leadTimeDays?: number;
    }
  ) {
    const data = await this.suppliersService.create(body);
    return { data, message: "Supplier created successfully", statusCode: 201 };
  }

  @Patch(":id")
  async updateSupplier(
    @Param("id") id: string,
    @Body()
    body: {
      supplierId?: string;
      name?: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      province?: string;
      country?: string;
      leadTimeDays?: number;
    }
  ) {
    const data = await this.suppliersService.update(id, body);
    return { data, message: "Supplier updated successfully", statusCode: 200 };
  }

  @Delete(":id")
  async deleteSupplier(@Param("id") id: string) {
    return this.suppliersService.remove(id);
  }

  @Post(":id/assign-assets")
  async assignAssets(
    @Param("id") id: string,
    @Body() body: { assetIds: string[] }
  ) {
    const data = await this.suppliersService.assignAssets(id, body.assetIds || []);
    return { data, message: "Assets assigned to supplier successfully", statusCode: 200 };
  }

  @Delete("assets/:assetId/unassign")
  async unassignAsset(@Param("assetId") assetId: string) {
    return this.suppliersService.removeAssetSupplier(assetId);
  }
}

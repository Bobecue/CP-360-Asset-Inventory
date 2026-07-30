import { Controller, Get, Post, Patch, Delete, Body, Param, Req as ReqCtx } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto, CreateSiteDto, UpdateSiteDto } from './dto/category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAllCategories() {
    const data = await this.categoriesService.findAllCategories(false);
    return { data, message: 'Expense categories fetched successfully', statusCode: 200 };
  }

  @Get('active')
  async findActiveCategories() {
    const data = await this.categoriesService.findAllCategories(true);
    return { data, message: 'Active expense categories fetched successfully', statusCode: 200 };
  }

  @Post()
  async createCategory(@Body() body: CreateCategoryDto, @ReqCtx() req: any) {
    const userIdentifier = req.headers['x-user'] || 'superadmin@contactpoint360.com';
    const data = await this.categoriesService.createCategory(body, userIdentifier);
    return { data, message: 'Expense category created successfully', statusCode: 201 };
  }

  @Patch(':id')
  async updateCategory(@Param('id') id: string, @Body() body: UpdateCategoryDto, @ReqCtx() req: any) {
    const userIdentifier = req.headers['x-user'] || 'superadmin@contactpoint360.com';
    const data = await this.categoriesService.updateCategory(id, body, userIdentifier);
    return { data, message: 'Expense category updated successfully', statusCode: 200 };
  }

  @Delete(':id')
  async deleteCategory(@Param('id') id: string, @ReqCtx() req: any) {
    const userIdentifier = req.headers['x-user'] || 'superadmin@contactpoint360.com';
    const data = await this.categoriesService.deleteCategory(id, userIdentifier);
    return { data, message: 'Expense category removed successfully', statusCode: 200 };
  }

  @Get('sites')
  async findAllSites() {
    const data = await this.categoriesService.findAllSites(false);
    return { data, message: 'Sites fetched successfully', statusCode: 200 };
  }

  @Get('sites/active')
  async findActiveSites() {
    const data = await this.categoriesService.findAllSites(true);
    return { data, message: 'Active sites fetched successfully', statusCode: 200 };
  }

  @Post('sites')
  async createSite(@Body() body: CreateSiteDto, @ReqCtx() req: any) {
    const userIdentifier = req.headers['x-user'] || 'superadmin@contactpoint360.com';
    const data = await this.categoriesService.createSite(body, userIdentifier);
    return { data, message: 'Site created successfully', statusCode: 201 };
  }

  @Patch('sites/:id')
  async updateSite(@Param('id') id: string, @Body() body: UpdateSiteDto, @ReqCtx() req: any) {
    const userIdentifier = req.headers['x-user'] || 'superadmin@contactpoint360.com';
    const data = await this.categoriesService.updateSite(id, body, userIdentifier);
    return { data, message: 'Site updated successfully', statusCode: 200 };
  }

  @Get('audit-logs')
  async getAuditLogs(@ReqCtx() req: any) {
    const userIdentifier = req.headers['x-user'] || 'superadmin@contactpoint360.com';
    const data = await this.categoriesService.getAuditLogs(userIdentifier);
    return { data, message: 'Category audit logs fetched successfully', statusCode: 200 };
  }
}

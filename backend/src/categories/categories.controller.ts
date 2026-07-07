import { Controller, Get, Post, Patch, Delete, Body, Param } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { CategoryType } from "@prisma/client";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getAllCategories() {
    return this.categoriesService.findAll();
  }

  @Post()
  async createCategory(
    @Body()
    body: {
      name: string;
      prefix: string;
      type: CategoryType;
      description?: string;
    },
  ) {
    return this.categoriesService.create(body);
  }

  @Patch(":id")
  async updateCategory(
    @Param("id") id: string,
    @Body()
    body: {
      name?: string;
      prefix?: string;
      type?: CategoryType;
      description?: string;
    },
  ) {
    return this.categoriesService.update(id, body);
  }

  @Delete(":id")
  async deleteCategory(@Param("id") id: string) {
    return this.categoriesService.remove(id);
  }
}

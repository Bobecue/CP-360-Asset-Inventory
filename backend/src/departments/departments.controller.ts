import { Controller, Get, Post, Delete, Body, Param } from "@nestjs/common";
import { DepartmentsService } from "./departments.service";

@Controller("departments")
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  async getAllDepartments() {
    return this.departmentsService.findAll();
  }

  @Post()
  async createDepartment(@Body() body: { name: string }) {
    return this.departmentsService.create(body);
  }

  @Delete(":id")
  async deleteDepartment(@Param("id") id: string) {
    return this.departmentsService.remove(id);
  }
}

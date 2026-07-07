import { Controller, Get, Post, Patch, Body, Param, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "./users.service";
import { Role } from "@prisma/client";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers() {
    return this.usersService.findAll();
  }

  @Post("login")
  async login(
    @Body() body: { email: string; passwordPlain: string }
  ) {
    return this.usersService.login(body.email, body.passwordPlain);
  }

  @Post()
  async createUser(
    @Body()
    body: {
      email: string;
      name: string;
      passwordPlain: string;
      role: Role;
      employeeId?: string;
      department?: string;
      siteId?: string;
    },
  ) {
    return this.usersService.create(body);
  }

  @Patch(":id")
  async updateUser(
    @Param("id") id: string,
    @Body()
    body: {
      email?: string;
      name?: string;
      role?: Role;
      employeeId?: string;
      department?: string;
      isActive?: boolean;
      siteId?: string;
    },
  ) {
    return this.usersService.update(id, body);
  }
}

import { Controller, Get, Patch, Post, Param, Query, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Query("userId") userId: string) {
    return this.notificationsService.findAllForUser(userId);
  }

  @Patch(":id/read")
  async markAsRead(@Param("id") id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Post("read-all")
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Query("userId") userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Post()
  async createNotification(
    @Body() body: { title: string; message: string; userId: string },
  ) {
    return this.notificationsService.create(body);
  }
}

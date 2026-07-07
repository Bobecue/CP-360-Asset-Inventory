import { Controller, Get, Post, Param, Body, Query, Req } from "@nestjs/common";
import { ReceivingService } from "./receiving.service";
import * as express from "express";

@Controller("receiving-reports")
export class ReceivingController {
  constructor(private readonly receivingService: ReceivingService) {}

  @Post()
  async createReceivingReport(
    @Body()
    body: {
      purchaseOrderId: string;
      receivedById: string;
      siteId: string;
      deliveryNoteRef?: string;
      invoiceNumber?: string;
      invoiceFileUrl?: string;
      items: { itemId: string; quantityReceived: number; serials?: string[] }[];
    },
    @Req() req: express.Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || "127.0.0.1";
    return this.receivingService.create({
      ...body,
      ipAddress,
    });
  }

  @Get()
  async getReceivingReports(@Query("siteId") siteId?: string) {
    return this.receivingService.findAll({ siteId });
  }

  @Get(":id")
  async getReceivingReportById(@Param("id") id: string) {
    return this.receivingService.findOne(id);
  }
}

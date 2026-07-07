import { Controller, Get, Query } from "@nestjs/common";
import { AuditLogsService } from "./audit-logs.service";

@Controller("audit-logs")
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  async getAuditLogs(
    @Query("itemId") itemId?: string,
    @Query("userId") userId?: string,
    @Query("limit") limit?: string,
  ) {
    return this.auditLogsService.findAll({ itemId, userId, limit });
  }
}

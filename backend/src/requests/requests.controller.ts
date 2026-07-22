import { Controller, Get, Post, Patch, Body, Param, Req as ReqCtx } from "@nestjs/common";
import { RequestsService } from "./requests.service";

@Controller("requests")
export class RequestsController {
  constructor(private svc: RequestsService) { }

  @Post()
  async create(@Body() body: any, @ReqCtx() req: any) {
    const user = req.headers["x-user"] || "user1";
    const data = await this.svc.create(body, user);
    return { data, message: "Request created successfully", statusCode: 201 };
  }

  @Get()
  async findAll(@ReqCtx() req: any) {
    const q = req.query || {};
    const user = req.headers["x-user"] || "user1";
    const data = await this.svc.findAll(q, user);
    return { data, message: "Requests fetched successfully", statusCode: 200 };
  }

  @Get("summary")
  async getSummary(@ReqCtx() req: any) {
    const user = req.headers["x-user"] || "user1";
    const data = await this.svc.getSummary(user);
    return {
      data,
      message: "Summary fetched",
      statusCode: 200,
    };
  }

  @Get("dashboard-summary")
  async getDashboardSummary(@ReqCtx() req: any) {
    const q = req.query || {};
    const siteId = q.siteId || undefined;
    const data = await this.svc.getDashboardSummary(siteId);
    return { data, message: "Dashboard summary fetched successfully", statusCode: 200 };
  }

  @Get("mine")
  async findMine(@ReqCtx() req: any) {
    const q = req.query || {};
    const user = req.headers["x-user"] || "user1";
    const status = q.status;
    const data = await this.svc.findMine(user, status);
    return { data, message: "My requests fetched", statusCode: 200 };
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const data = await this.svc.findOne(id);
    return { data, message: "Request details fetched successfully", statusCode: 200 };
  }

  @Post("bulk-approve")
  async bulkApprove(@Body() body: { ids: string[]; approverEmail?: string; comment?: string }, @ReqCtx() req: any) {
    const approverEmail = body.approverEmail || req.headers["x-user"] || "superadmin@contactpoint360.com";
    const data = await this.svc.bulkApprove(body.ids || [], approverEmail, body.comment);
    return { data, message: `Successfully bulk approved ${data.length} request(s)`, statusCode: 200 };
  }

  @Post("bulk-prepare-pickup")
  async bulkPreparePickup(@Body() body: { ids: string[]; staffEmail?: string; comment?: string }, @ReqCtx() req: any) {
    const staffEmail = body.staffEmail || req.headers["x-user"] || "superadmin@contactpoint360.com";
    const data = await this.svc.bulkPreparePickup(body.ids || [], staffEmail, body.comment);
    return { data, message: `Successfully staged ${data.length} request(s) for pickup`, statusCode: 200 };
  }

  @Post("bulk-release")
  async bulkRelease(@Body() body: { ids: string[]; releaserEmail?: string; comment?: string }, @ReqCtx() req: any) {
    const releaserEmail = body.releaserEmail || req.headers["x-user"] || "superadmin@contactpoint360.com";
    const data = await this.svc.bulkRelease(body.ids || [], releaserEmail, body.comment);
    return { data, message: `Successfully bulk released ${data.length} request(s)`, statusCode: 200 };
  }

  @Post("bulk-cancel")
  async bulkCancel(@Body() body: { ids: string[]; userEmail?: string; comment?: string }, @ReqCtx() req: any) {
    const userEmail = body.userEmail || req.headers["x-user"] || "superadmin@contactpoint360.com";
    const data = await this.svc.bulkCancel(body.ids || [], userEmail, body.comment);
    return { data, message: `Successfully cancelled ${data.length} request(s)`, statusCode: 200 };
  }

  @Post("bulk-confirm-receipt")
  async bulkConfirmReceipt(@Body() body: { ids: string[]; userEmail?: string }, @ReqCtx() req: any) {
    const userEmail = body.userEmail || req.headers["x-user"] || "superadmin@contactpoint360.com";
    const data = await this.svc.bulkConfirmReceipt(body.ids || [], userEmail);
    return { data, message: `Successfully confirmed receipt of ${data.length} request(s)`, statusCode: 200 };
  }

  @Post([":id/approve", ":id/approved", ":id/ready_for_pickup"])
  async approve(@Param("id") id: string, @Body() body: any) {
    const data = await this.svc.approve(id, body.comment, body.approverEmail);
    return { data, message: "Request approved successfully", statusCode: 200 };
  }

  @Post([":id/reject", ":id/rejected"])
  async reject(@Param("id") id: string, @Body() body: any) {
    const data = await this.svc.reject(id, body.comment, body.approverEmail);
    return { data, message: "Request rejected successfully", statusCode: 200 };
  }

  @Post(":id/release")
  async release(@Param("id") id: string, @Body() body: any) {
    const data = await this.svc.release(id, body.assetId, body.releaserEmail);
    return { data, message: "Asset released successfully", statusCode: 200 };
  }

  @Post([":id/return", ":id/returned"])
  async returnAsset(@Param("id") id: string, @Body() body: any) {
    const data = await this.svc.return(id, body.comment, body.returnerEmail);
    return { data, message: "Request item returned successfully", statusCode: 200 };
  }

  @Patch(":id/review")
  async review(@Param("id") id: string, @Body() body: { status: "APPROVED" | "REJECTED"; reviewComment?: string; approverEmail?: string }) {
    if (body.status === "APPROVED") {
      const data = await this.svc.approve(id, body.reviewComment, body.approverEmail);
      return { data, message: "Request approved successfully", statusCode: 200 };
    } else {
      const data = await this.svc.reject(id, body.reviewComment, body.approverEmail);
      return { data, message: "Request rejected successfully", statusCode: 200 };
    }
  }

  @Patch(":id/withdraw")
  async cancel(@Param("id") id: string) {
    const data = await this.svc.cancel(id);
    return { data, message: "Request cancelled successfully", statusCode: 200 };
  }

  @Post(":id/comment")
  async addComment(@Param("id") id: string, @Body() body: { comment: string }, @ReqCtx() req: any) {
    const user = req.headers["x-user"] || "user1";
    const data = await this.svc.addComment(id, body.comment, user);
    return { data, message: "Comment added successfully", statusCode: 200 };
  }
}

import { Controller, Get, Param } from "@nestjs/common";
import { AssetsService } from "./assets.service";

@Controller("assets")
export class AssetsController {
  constructor(private readonly svc: AssetsService) {}

  @Get(":id/history")
  async getHistory(@Param("id") id: string) {
    const data = await this.svc.getHistory(id);
    return { data, message: "Asset history fetched successfully", statusCode: 200 };
  }
}

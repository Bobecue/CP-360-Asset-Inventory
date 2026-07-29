import { Controller, Get, Post, Patch, Body, Param, Query, Req as ReqCtx, BadRequestException } from '@nestjs/common';
import { OpexService } from './opex.service';
import { CreateOpexEntryDto, UpdateOpexEntryDto, ApproveOpexEntryDto, LockMonthDto } from './dto/opex.dto';

@Controller('opex')
export class OpexController {
  constructor(private readonly opexService: OpexService) {}

  @Post('entries')
  async create(@Body() body: CreateOpexEntryDto, @ReqCtx() req: any) {
    const userIdentifier = req.headers['x-user'] || 'superadmin@contactpoint360.com';
    const data = await this.opexService.create(body, userIdentifier);
    return { data, message: 'OPEX entry created successfully', statusCode: 201 };
  }

  @Get('entries')
  async findAll(
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('status') status?: string,
    @Query('isCapex') isCapex?: string,
  ) {
    const data = await this.opexService.findAll({
      year: year ? parseInt(year, 10) : undefined,
      month: month ? parseInt(month, 10) : undefined,
      status: status || undefined,
      isCapex: isCapex !== undefined ? isCapex === 'true' : undefined,
    });
    return { data, message: 'OPEX entries fetched successfully', statusCode: 200 };
  }

  @Get('entries/:id')
  async findOne(@Param('id') id: string) {
    const data = await this.opexService.findOne(id);
    return { data, message: 'OPEX entry fetched successfully', statusCode: 200 };
  }

  @Patch('entries/:id')
  async update(@Param('id') id: string, @Body() body: UpdateOpexEntryDto, @ReqCtx() req: any) {
    const userIdentifier = req.headers['x-user'] || 'superadmin@contactpoint360.com';
    const data = await this.opexService.update(id, body, userIdentifier);
    return { data, message: 'OPEX entry updated successfully', statusCode: 200 };
  }

  @Post('entries/:id/approve')
  async approve(@Param('id') id: string, @Body() body: ApproveOpexEntryDto, @ReqCtx() req: any) {
    const userIdentifier = req.headers['x-user'] || 'superadmin@contactpoint360.com';
    const data = await this.opexService.approve(id, body, userIdentifier);
    return { data, message: `OPEX entry status updated to ${data.status}`, statusCode: 200 };
  }

  @Post('lock-month')
  async lockMonth(@Body() body: LockMonthDto, @ReqCtx() req: any) {
    if (!body.year || !body.month) {
      throw new BadRequestException('Year and month are required to lock a month.');
    }
    const userIdentifier = req.headers['x-user'] || 'superadmin@contactpoint360.com';
    const data = await this.opexService.lockMonth(body, userIdentifier);
    return { data, message: `Month ${data.yearMonth} locked successfully`, statusCode: 200 };
  }

  @Get('report')
  async getReport(@Query('year') yearStr: string, @Query('month') monthStr: string) {
    const now = new Date();
    const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear();
    const month = monthStr ? parseInt(monthStr, 10) : now.getMonth() + 1;

    const data = await this.opexService.getRollupReport(year, month);
    return { data, message: 'OPEX rollup report generated successfully', statusCode: 200 };
  }

  @Get('archives')
  async getArchives() {
    const data = await this.opexService.getArchives();
    return { data, message: 'OPEX monthly archives fetched successfully', statusCode: 200 };
  }

  @Get('archives/:yearMonth')
  async getArchiveByYearMonth(@Param('yearMonth') yearMonth: string) {
    const data = await this.opexService.getArchiveByYearMonth(yearMonth);
    return { data, message: `Archive for ${yearMonth} fetched successfully`, statusCode: 200 };
  }
}

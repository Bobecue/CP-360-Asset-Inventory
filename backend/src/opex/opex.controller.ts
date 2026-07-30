import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req as ReqCtx, Res, BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OpexService } from './opex.service';
import { CreateOpexEntryDto, UpdateOpexEntryDto, ApproveOpexEntryDto, LockMonthDto, UnlockMonthDto } from './dto/opex.dto';

@Controller('opex')
export class OpexController {
  constructor(private readonly opexService: OpexService) { }

  @Get('attachments/:attachmentId/file')
  async streamAttachment(
    @Param('attachmentId') attachmentId: string,
    @ReqCtx() req: any,
    @Res() res: any,
  ) {
    const userIdentifier = req.headers['x-user'] || 'superadmin@contactpoint360.com';
    const { attachment, absolutePath } = await this.opexService.getAttachmentFile(attachmentId, userIdentifier);

    res.setHeader('Content-Type', attachment.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${attachment.originalFilename}"`);
    return res.sendFile(absolutePath);
  }

  @Post('entries/:id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(@Param('id') id: string, @UploadedFile() file: any, @ReqCtx() req: any) {
    const userIdentifier = req.headers['x-user'] || 'superadmin@contactpoint360.com';
    const data = await this.opexService.uploadAttachment(id, file, userIdentifier);
    return { data, message: 'Attachment uploaded successfully', statusCode: 201 };
  }

  @Delete('entries/:id/attachments/:attachmentId')
  async removeAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Body('reason') reason: string,
    @ReqCtx() req: any,
  ) {
    const userIdentifier = req.headers['x-user'] || 'superadmin@contactpoint360.com';
    const data = await this.opexService.removeAttachment(id, attachmentId, reason, userIdentifier);
    return { data, message: 'Attachment removed successfully', statusCode: 200 };
  }

  @Post('unlock-month')
  async unlockMonth(@Body() body: UnlockMonthDto, @ReqCtx() req: any) {
    const userIdentifier = req.headers['x-user'] || 'superadmin@contactpoint360.com';
    const data = await this.opexService.unlockMonth(body, userIdentifier);
    return { data, message: data.message, statusCode: 200 };
  }

  @Delete('entries/:id')
  async remove(@Param('id') id: string) {
    const data = await this.opexService.remove(id);
    return { data, message: 'OPEX entry deleted successfully', statusCode: 200 };
  }

  @Delete('entries')
  async removeAll() {
    const data = await this.opexService.removeAll();
    return { data, message: 'All OPEX entries deleted successfully', statusCode: 200 };
  }

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
    @Query('siteId') siteId?: string,
    @Query('destinationName') destinationName?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.opexService.findAll({
      year: year ? parseInt(year, 10) : undefined,
      month: month ? parseInt(month, 10) : undefined,
      status: status || undefined,
      isCapex: isCapex !== undefined ? isCapex === 'true' : undefined,
      siteId: siteId || undefined,
      destinationName: destinationName || undefined,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 25,
    });
    return {
      data: result.data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
      message: 'OPEX entries fetched successfully',
      statusCode: 200,
    };
  }

  @Get('entries/export')
  async exportAll(
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('status') status?: string,
    @Query('isCapex') isCapex?: string,
    @Query('siteId') siteId?: string,
    @Query('destinationName') destinationName?: string,
  ) {
    const data = await this.opexService.findAllForExport({
      year: year ? parseInt(year, 10) : undefined,
      month: month ? parseInt(month, 10) : undefined,
      status: status || undefined,
      isCapex: isCapex !== undefined ? isCapex === 'true' : undefined,
      siteId: siteId || undefined,
      destinationName: destinationName || undefined,
    });
    return { data, message: 'OPEX export fetched successfully', statusCode: 200 };
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
  async getReport(
    @Query('year') yearStr: string,
    @Query('month') monthStr: string,
    @Query('siteId') siteId?: string,
    @Query('destinationName') destinationName?: string,
    @ReqCtx() req?: any,
  ) {
    const userIdentifier = req?.headers['x-user'] || 'superadmin@contactpoint360.com';
    const now = new Date();
    const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear();
    const month = monthStr ? parseInt(monthStr, 10) : now.getMonth() + 1;

    const data = await this.opexService.getRollupReport(year, month, userIdentifier, siteId, destinationName);
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

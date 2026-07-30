import { Module } from '@nestjs/common';
import { OpexController } from './opex.controller';
import { OpexService } from './opex.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [PrismaModule, AuditLogsModule],
  controllers: [OpexController],
  providers: [OpexService],
  exports: [OpexService],
})
export class OpexModule {}

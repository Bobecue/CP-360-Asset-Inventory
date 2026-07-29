import { Module } from '@nestjs/common';
import { OpexController } from './opex.controller';
import { OpexService } from './opex.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OpexController],
  providers: [OpexService],
  exports: [OpexService],
})
export class OpexModule {}

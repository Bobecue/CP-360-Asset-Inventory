import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { MovementsController } from './movements.controller';

@Module({ providers: [RequestsService], controllers: [RequestsController, MovementsController] })
export class RequestsModule { }

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { SitesModule } from './sites/sites.module';
import { CategoriesModule } from './categories/categories.module';
import { AssetsModule } from './assets/assets.module';
import { DepartmentsModule } from './departments/departments.module';
import { RequestsModule } from './requests/requests.module';
import { ItemsModule } from './items/items.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { ReceivingModule } from './receiving/receiving.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    SitesModule,
    CategoriesModule,
    AssetsModule,
    DepartmentsModule,
    RequestsModule,
    ItemsModule,
    NotificationsModule,
    AuditLogsModule,
    PurchaseOrdersModule,
    ReceivingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

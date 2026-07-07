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

@Module({
  imports: [PrismaModule, UsersModule, SitesModule, CategoriesModule, AssetsModule, DepartmentsModule, RequestsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

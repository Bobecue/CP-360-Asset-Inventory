import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('items')
  async getItems() {
    const dbItems = await this.prisma.item.findMany({
      include: {
        category: true,
        stockLevels: true,
      },
    });

    return dbItems.map((item) => {
      const totalStock = item.stockLevels.reduce((sum, stock) => sum + stock.quantity, 0);
      let catName = item.category?.name;
      if (item.category?.type === 'CONSUMABLE') {
        catName = 'Consumables';
      } else if (catName === 'Equipment') {
        catName = 'Laptops';
      } else if (catName === 'Monitors') {
        catName = 'Accessories';
      }
      return {
        id: item.id,
        name: item.name,
        sku: item.sku,
        stock: totalStock,
        category: catName,
      };
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async getHistory(tagCode: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { tagCode },
    });
    
    // If not found by tagCode, try ID
    const actualAsset = asset || await this.prisma.asset.findUnique({
      where: { id: tagCode }
    });

    if (!actualAsset) {
      throw new NotFoundException('Asset not found');
    }

    const events = await this.prisma.assetEvent.findMany({
      where: { assetId: actualAsset.id },
      include: {
        user: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      asset: actualAsset,
      history: events
    };
  }
}

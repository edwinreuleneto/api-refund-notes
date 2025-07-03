// Dependencies
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { TaxCouponStatus } from '@prisma/client';

// DTO
import { FilesService } from '../files/files.service';
import { PrismaService } from '../prisma/prisma.service';

// Module
import { TAX_COUPON_QUEUE } from '../queue/queue.module';

@Injectable()
export class TaxCouponService {
  private readonly logger = new Logger(TaxCouponService.name);
  constructor(
    private readonly filesService: FilesService,
    private readonly prisma: PrismaService,
    @Inject(TAX_COUPON_QUEUE) private readonly queue: Queue,
  ) {}

  async create(file: Express.Multer.File) {
    try {
      const fileData = await this.filesService.upload(file);
      const savedFile = await this.prisma.files.create({ data: fileData });

      const taxCoupon = await this.prisma.taxCoupon.create({
        data: { fileId: savedFile.id },
      });

      await this.queue.add('process', {
        taxCouponId: taxCoupon.id,
        fileId: savedFile.id,
      });

      await this.prisma.taxCoupon.update({
        where: { id: taxCoupon.id },
        data: { status: TaxCouponStatus.TEXTRACT_INITIATED },
      });

      return taxCoupon;
    } catch (error) {
      this.logger.error('Failed to create tax coupon', error as Error);
      throw error;
    }
  }
}

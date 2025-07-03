import { Module } from '@nestjs/common';
import { TaxCouponService } from './tax-coupon.service';
import { TaxCouponController } from './tax-coupon.controller';
import { FilesModule } from '../files/files.module';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [FilesModule, PrismaModule, QueueModule],
  controllers: [TaxCouponController],
  providers: [TaxCouponService],
})
export class TaxCouponModule {}

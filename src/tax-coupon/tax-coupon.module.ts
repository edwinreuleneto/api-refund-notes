import { Module } from '@nestjs/common';
import { TaxCouponService } from './tax-coupon.service';
import { TaxCouponController } from './tax-coupon.controller';

@Module({
  controllers: [TaxCouponController],
  providers: [TaxCouponService],
})
export class TaxCouponModule {}

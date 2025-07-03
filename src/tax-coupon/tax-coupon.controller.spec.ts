import { Test, TestingModule } from '@nestjs/testing';
import { TaxCouponController } from './tax-coupon.controller';
import { TaxCouponService } from './tax-coupon.service';

describe('TaxCouponController', () => {
  let controller: TaxCouponController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaxCouponController],
      providers: [TaxCouponService],
    }).compile();

    controller = module.get<TaxCouponController>(TaxCouponController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

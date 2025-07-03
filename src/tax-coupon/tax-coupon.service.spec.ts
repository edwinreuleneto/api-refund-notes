import { Test, TestingModule } from '@nestjs/testing';
import { TaxCouponService } from './tax-coupon.service';

describe('TaxCouponService', () => {
  let service: TaxCouponService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaxCouponService],
    }).compile();

    service = module.get<TaxCouponService>(TaxCouponService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

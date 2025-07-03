import { Test, TestingModule } from '@nestjs/testing';
import { TaxCouponController } from './tax-coupon.controller';
import { TaxCouponService } from './tax-coupon.service';
import { FilesService } from '../files/files.service';
import { PrismaService } from '../prisma/prisma.service';
import { TAX_COUPON_QUEUE } from '../queue/queue.module';

describe('TaxCouponController', () => {
  let controller: TaxCouponController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaxCouponController],
      providers: [
        TaxCouponService,
        { provide: FilesService, useValue: {} },
        { provide: PrismaService, useValue: {} },
        { provide: TAX_COUPON_QUEUE, useValue: { add: jest.fn() } },
      ],
    }).compile();

    controller = module.get<TaxCouponController>(TaxCouponController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

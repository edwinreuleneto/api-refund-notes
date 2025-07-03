import { Test, TestingModule } from '@nestjs/testing';
import { TaxCouponService } from './tax-coupon.service';
import { FilesService } from '../files/files.service';
import { PrismaService } from '../prisma/prisma.service';
import { TAX_COUPON_QUEUE } from '../queue/queue.module';

describe('TaxCouponService', () => {
  let service: TaxCouponService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxCouponService,
        { provide: FilesService, useValue: {} },
        { provide: PrismaService, useValue: {} },
        { provide: TAX_COUPON_QUEUE, useValue: { add: jest.fn() } },
      ],
    }).compile();

    service = module.get<TaxCouponService>(TaxCouponService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

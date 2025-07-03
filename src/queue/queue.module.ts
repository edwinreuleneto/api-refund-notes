import { Global, Module } from '@nestjs/common';
import { Queue } from 'bullmq';

export const TAX_COUPON_QUEUE = 'tax-coupon-queue';

const queueProvider = {
  provide: TAX_COUPON_QUEUE,
  useFactory: () =>
    new Queue(TAX_COUPON_QUEUE, {
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    }),
};

@Global()
@Module({
  providers: [queueProvider],
  exports: [queueProvider],
})
export class QueueModule {}

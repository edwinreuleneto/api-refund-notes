import { Global, Module } from '@nestjs/common';
import { Queue } from 'bullmq';

export const TAX_COUPON_QUEUE = 'tax-coupon-queue';
export const OPEN_AI_QUEUE = 'open-ai-queue';

const taxCouponQueueProvider = {
  provide: TAX_COUPON_QUEUE,
  useFactory: () => {
    try {
      const queue = new Queue(TAX_COUPON_QUEUE, {
        connection: {
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT),
          password: process.env.REDIS_PASSWORD,
        },
      });

      console.log(`Conectado à fila: ${TAX_COUPON_QUEUE}`);
      return queue;
    } catch (error) {
      console.error('Erro ao conectar ao Redis:', error);

      console.log({
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      });

      throw error;
    }
  },
};

const openAiQueueProvider = {
  provide: OPEN_AI_QUEUE,
  useFactory: () => {
    try {
      const queue = new Queue(OPEN_AI_QUEUE, {
        connection: {
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT),
          password: process.env.REDIS_PASSWORD,
        },
      });

      console.log(`Conectado à fila: ${OPEN_AI_QUEUE}`);
      return queue;
    } catch (error) {
      console.error('Erro ao conectar ao Redis:', error);

      console.log({
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      });

      throw error;
    }
  },
};

@Global()
@Module({
  providers: [taxCouponQueueProvider, openAiQueueProvider],
  exports: [taxCouponQueueProvider, openAiQueueProvider],
})
export class QueueModule {}

import { Global, Module } from '@nestjs/common';
import { Queue } from 'bullmq';

export const TAX_COUPON_QUEUE = 'tax-coupon-queue';

const queueProvider = {
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

@Global()
@Module({
  providers: [queueProvider],
  exports: [queueProvider],
})
export class QueueModule {}

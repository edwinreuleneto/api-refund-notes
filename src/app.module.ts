// Dependencies
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Controller
import { AppController } from './app.controller';

// Service
import { AppService } from './app.service';

// Modules
import { PrismaModule } from './prisma/prisma.module';
import { TaxCouponModule } from './tax-coupon/tax-coupon.module';
import { FilesModule } from './files/files.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    PrismaModule,
    TaxCouponModule,
    FilesModule,
    QueueModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

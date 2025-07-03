// Dependencies
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Modules
import { PrismaModule } from './prisma/prisma.module';
import { TaxCouponModule } from './tax-coupon/tax-coupon.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [PrismaModule, TaxCouponModule, FilesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { PrismaModule } from '../prisma/prisma.module';
import { OcrService } from './ocr.service';

@Module({
  imports: [QueueModule, PrismaModule],
  providers: [OcrService],
})
export class OcrModule {}

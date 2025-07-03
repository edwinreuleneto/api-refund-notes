import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { PrismaModule } from '../prisma/prisma.module';
import { OpenAiService } from './open-ai.service';

@Module({
  imports: [QueueModule, PrismaModule],
  providers: [OpenAiService],
})
export class OpenAiModule {}

import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { PrismaModule } from '../prisma/prisma.module';
import { FilesModule } from '../files/files.module';
import { OpenAiService } from './open-ai.service';

@Module({
  imports: [QueueModule, PrismaModule, FilesModule],
  providers: [OpenAiService],
})
export class OpenAiModule {}

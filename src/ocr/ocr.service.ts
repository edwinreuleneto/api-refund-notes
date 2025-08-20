import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Worker, Job, Queue } from 'bullmq';
import {
  TextractClient,
  DetectDocumentTextCommand,
} from '@aws-sdk/client-textract';
import { PrismaService } from '../prisma/prisma.service';
import { TAX_COUPON_QUEUE, OPEN_AI_QUEUE } from '../queue/queue.module';
import { TaxCouponStatus } from '@prisma/client';

interface ProcessJobData {
  taxCouponId: string;
  fileId: string;
  categories?: string[];
}

@Injectable()
export class OcrService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OcrService.name);
  private worker?: Worker;
  private readonly textract: TextractClient;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(TAX_COUPON_QUEUE) private readonly queue: Queue,
    @Inject(OPEN_AI_QUEUE) private readonly aiQueue: Queue,
  ) {
    this.textract = new TextractClient({
      region: process.env.AWS_REGION_INTERNAL ?? 'region',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID_INTERNAL ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_INTERNAL ?? '',
      },
    });
  }

  onModuleInit() {
    this.worker = new Worker<ProcessJobData>(
      this.queue.name,
      (job) => this.process(job),
      { connection: this.queue.opts.connection },
    );
    this.worker.on('error', (err) => this.logger.error('Worker error', err));
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }

  private async process(job: Job<ProcessJobData>) {
    const { taxCouponId, fileId, categories } = job.data;

    this.logger.verbose(`Starting OCR processing for taxCoupon ${taxCouponId}`);
    try {
      await this.prisma.taxCoupon.update({
        where: { id: taxCouponId },
        data: { status: TaxCouponStatus.TEXTRACT_INITIATED },
      });

      const file = await this.prisma.files.findUnique({
        where: { id: fileId },
      });

      console.log({ file });
      if (!file) {
        throw new Error('File not found');
      }

      const bucket = process.env.AWS_ACCESS_BUCKET_INTERNAL ?? 'bucket';
      const key = `${file.file}`;

      console.log({ key });
      console.log({ bucket });
      console.log({ region: process.env.AWS_REGION_INTERNAL ?? 'region' });

      const response = await this.textract.send(
        new DetectDocumentTextCommand({
          Document: { S3Object: { Bucket: bucket, Name: key } },
        }),
      );

      const text =
        response.Blocks?.filter((b) => b.BlockType === 'LINE' && b.Text)
          .map((b) => b.Text)
          .join('\n') ?? '';

      await this.prisma.filesOcr.create({
        data: {
          fileId,
          content: text,
        },
      });

      await this.prisma.taxCoupon.update({
        where: { id: taxCouponId },
        data: { status: TaxCouponStatus.TEXTRACT_COMPLETED },
      });

      await this.aiQueue.add('process-ai', {
        taxCouponId,
        fileId,
        categories,
      });
    } catch (error) {
      this.logger.error('OCR processing failed', error as Error);
      await this.prisma.taxCoupon.update({
        where: { id: taxCouponId },
        data: { status: TaxCouponStatus.FAILED },
      });
    }
  }
}

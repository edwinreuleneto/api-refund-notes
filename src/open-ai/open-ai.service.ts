import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker, Job, Queue } from 'bullmq';
import { OpenAI } from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { OPEN_AI_QUEUE } from '../queue/queue.module';
import { TaxCouponStatus } from '@prisma/client';

interface AiJobData {
  taxCouponId: string;
  fileId: string;
}

@Injectable()
export class OpenAiService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OpenAiService.name);
  private worker?: Worker;
  private readonly openai: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(OPEN_AI_QUEUE) private readonly queue: Queue,
  ) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  onModuleInit() {
    this.worker = new Worker<AiJobData>(
      this.queue.name,
      (job) => this.process(job),
      { connection: this.queue.opts.connection },
    );
    this.worker.on('error', (err) => this.logger.error('AI Worker error', err));
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }

  private async process(job: Job<AiJobData>) {
    const { taxCouponId, fileId } = job.data;
    try {
      await this.prisma.taxCoupon.update({
        where: { id: taxCouponId },
        data: { status: TaxCouponStatus.AI_INITIATED },
      });

      const ocr = await this.prisma.filesOcr.findFirst({
        where: { fileId },
        orderBy: { createdAt: 'desc' },
      });

      if (!ocr) {
        throw new Error('OCR not found');
      }

      const prompt = `Extract the receipt information as JSON in the following format: { establishment: { name, cnpj, state_registration, address: { street, number, complement, neighborhood, city, state, postal_code } }, document: { type, description, series, number, issue_date, access_key, consult_url, receipt_url }, items: [ { code, description, quantity, unit, unit_price, total_price, category_system } ], totals: { total_items, subtotal, total, payment_method }, customer: { identified } } from the text:\n\n${ocr.content}`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      });

      const resultText = completion.choices[0]?.message?.content ?? '{}';
      const data = JSON.parse(resultText);

      await this.prisma.taxCouponAi.create({
        data: {
          taxCouponId,
          data,
        },
      });

      await this.prisma.taxCoupon.update({
        where: { id: taxCouponId },
        data: { status: TaxCouponStatus.AI_COMPLETED },
      });
    } catch (error) {
      this.logger.error('AI processing failed', error as Error);
      await this.prisma.taxCoupon.update({
        where: { id: taxCouponId },
        data: { status: TaxCouponStatus.FAILED },
      });
    }
  }
}

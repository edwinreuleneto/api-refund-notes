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
  private readonly assistantId: string;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(OPEN_AI_QUEUE) private readonly queue: Queue,
  ) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.assistantId = process.env.OPENAI_ASSISTANT_ID ?? '';
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

      const thread = await this.openai.beta.threads.create({
        messages: [{ role: 'user', content: prompt }],
      });

      const run = await this.openai.beta.threads.runs.create(thread.id, {
        assistant_id: this.assistantId,
      });

      let runStatus = run;
      while (
        runStatus.status === 'queued' ||
        runStatus.status === 'in_progress'
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        runStatus = await this.openai.beta.threads.runs.retrieve(
          thread.id,
          run.id,
        );
      }

      if (runStatus.status !== 'completed') {
        throw new Error('Assistant run failed');
      }

      const messages = await this.openai.beta.threads.messages.list(thread.id);
      const resultText =
        messages.data[messages.data.length - 1]?.content[0]?.text?.value ?? '{}';

      const data = JSON.parse(resultText) as any;

      await this.prisma.$transaction(async (tx) => {
        const aiRecord = await tx.taxCouponAi.create({
          data: {
            taxCouponId,
            establishment: data.establishment
              ? {
                  create: {
                    name: data.establishment.name,
                    cnpj: data.establishment.cnpj,
                    stateRegistration: data.establishment.state_registration,
                    addressStreet: data.establishment.address?.street,
                    addressNumber: data.establishment.address?.number,
                    addressComplement: data.establishment.address?.complement,
                    addressNeighborhood: data.establishment.address?.neighborhood,
                    addressCity: data.establishment.address?.city,
                    addressState: data.establishment.address?.state,
                    addressPostalCode: data.establishment.address?.postal_code,
                  },
                }
              : undefined,
            document: data.document
              ? {
                  create: {
                    type: data.document.type,
                    description: data.document.description,
                    series: data.document.series,
                    number: data.document.number,
                    issueDate: data.document.issue_date
                      ? new Date(data.document.issue_date)
                      : null,
                    accessKey: data.document.access_key,
                    consultUrl: data.document.consult_url,
                    receiptUrl: data.document.receipt_url,
                  },
                }
              : undefined,
            totals: data.totals
              ? {
                  create: {
                    totalItems: data.totals.total_items,
                    subtotal: data.totals.subtotal,
                    total: data.totals.total,
                    paymentMethod: data.totals.payment_method,
                  },
                }
              : undefined,
            customer: data.customer
              ? {
                  create: {
                    identified: data.customer.identified,
                  },
                }
              : undefined,
            items: Array.isArray(data.items)
              ? {
                  createMany: {
                    data: data.items.map((item: any) => ({
                      code: item.code,
                      description: item.description,
                      quantity: item.quantity,
                      unit: item.unit,
                      unitPrice: item.unit_price,
                      totalPrice: item.total_price,
                      categorySystem: item.category_system,
                    })),
                  },
                }
              : undefined,
          },
        });

        await tx.taxCoupon.update({
          where: { id: taxCouponId },
          data: { status: TaxCouponStatus.AI_COMPLETED },
        });
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

// Dependencies
import { OpenAI } from 'openai';
import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Worker, Job, Queue } from 'bullmq';
import { TaxCouponStatus } from '@prisma/client';

// Services
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';

// Modules
import { OPEN_AI_QUEUE } from '../queue/queue.module';

// Interface
import { TaxCouponAiResponse } from './interfaces/tax-coupon-ai-response.interface';

interface AiJobData {
  taxCouponId: string;
  fileId: string;
  categories?: string[];
}

type TextBlock = {
  type: 'text';
  text: {
    value: string;
    annotations?: unknown[];
  };
};

function isTextBlock(block: any): block is TextBlock {
  return block?.type === 'text' && typeof block.text?.value === 'string';
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
    private readonly filesService: FilesService,
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
    const { taxCouponId, fileId, categories } = job.data;
    this.logger.verbose(`Starting AI processing for taxCoupon ${taxCouponId}`);
    try {
      await this.updateStatus(taxCouponId, TaxCouponStatus.AI_INITIATED);

      const { content, image, extension } = await this.getOcrAndImage(fileId);
      const prompt = this.buildPrompt(content, categories);

      const thread = await this.createThread(prompt, extension, image);
      const run = await this.startRun(thread.id);
      const runStatus = await this.waitForCompletion(thread.id, run.id);

      if (runStatus.status !== 'completed') {
        throw new Error('Assistant run failed');
      }

      const data = await this.fetchResponse(thread.id);
      await this.saveAiData(taxCouponId, data);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : JSON.stringify(error ?? 'Unknown error');
      this.logger.error(`AI processing failed: ${message}`);
      await this.updateStatus(taxCouponId, TaxCouponStatus.FAILED);
    }
  }

  private buildPrompt(text: string, categories?: string[]): string {
    const categoriesText =
      categories && categories.length
        ? `\n\nCATEGORIES:\n${categories.join(', ')}`
        : '';
    return `OCR:\n\n${text}${categoriesText}`;
  }

  private async updateStatus(id: string, status: TaxCouponStatus) {
    await this.prisma.taxCoupon.update({ where: { id }, data: { status } });
  }

  private async getOcrAndImage(fileId: string) {
    const [ocr, file] = await Promise.all([
      this.prisma.filesOcr.findFirst({
        where: { fileId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.files.findUnique({
        where: { id: fileId },
      }),
    ]);

    if (!ocr) {
      throw new Error('OCR not found');
    }

    if (!file) {
      throw new Error('File not found');
    }

    const presigned = await this.filesService.generatePresignedUrl(
      file.folder,
      file.file,
    );

    return {
      content: ocr.content,
      image: presigned,
      extension: file.extension,
    };
  }

  private async createThread(prompt: string, ext: string, image: string) {
    return this.openai.beta.threads.create({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: image },
            },
          ],
        },
      ],
    });
  }

  private async startRun(threadId: string) {
    return this.openai.beta.threads.runs.create(threadId, {
      assistant_id: this.assistantId,
    });
  }

  private async waitForCompletion(threadId: string, runId: string) {
    while (true) {
      const runStatus = await this.openai.beta.threads.runs.retrieve(
        threadId,
        runId,
      );
      this.logger.log(`📊 Status do run: ${runStatus.status}`);
      if (runStatus.status === 'completed' || runStatus.status === 'failed')
        return runStatus;
      await new Promise((res) => setTimeout(res, 1500));
    }
  }

  private async fetchResponse(threadId: string): Promise<TaxCouponAiResponse> {
    const messages = await this.openai.beta.threads.messages.list(threadId);
    const lastMessage = messages.data[0];

    const block = lastMessage.content[0];
    if (!isTextBlock(block)) {
      throw new Error('Unexpected assistant response');
    }
    return JSON.parse(block.text.value) as TaxCouponAiResponse;
  }

  private async saveAiData(id: string, data: TaxCouponAiResponse) {
    await this.prisma.$transaction(async (tx) => {
      await tx.taxCouponAi.create({
        data: {
          taxCouponId: id,
          establishment: {
            create: {
              name: data.establishment.name,
              cnpj: data.establishment.cnpj,
              stateRegistration: data.establishment.state_registration,
              addressStreet: data.establishment.address.street,
              addressNumber: data.establishment.address.number,
              addressComplement: data.establishment.address.complement,
              addressNeighborhood: data.establishment.address.neighborhood,
              addressCity: data.establishment.address.city,
              addressState: data.establishment.address.state,
              addressPostalCode: data.establishment.address.postal_code,
            },
          },
          document: {
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
          },
          totals: {
            create: {
              totalItems: data.totals.total_items,
              subtotal: data.totals.subtotal,
              total: data.totals.total,
              paymentMethod: data.totals.payment_method,
            },
          },
          customer: {
            create: {
              identified: data.customer.identified,
            },
          },
          items: {
            createMany: {
              data: data.items.map((item) => ({
                code: item.code,
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unit_price,
                totalPrice: item.total_price,
                categorySystem: item.category_system,
              })),
            },
          },
        },
      });

      await tx.taxCoupon.update({
        where: { id },
        data: { status: TaxCouponStatus.AI_COMPLETED },
      });
    });
  }
}

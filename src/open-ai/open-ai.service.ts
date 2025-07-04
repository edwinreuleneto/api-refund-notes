import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Worker, Job, Queue } from 'bullmq';
import { OpenAI } from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { FiscalLookupService } from '../fiscal-lookup/fiscal-lookup.service';
import { OPEN_AI_QUEUE } from '../queue/queue.module';
import { TaxCouponStatus } from '@prisma/client';
import { TaxCouponAiResponse } from './interfaces/tax-coupon-ai-response.interface';

interface AiJobData {
  taxCouponId: string;
  fileId: string;
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
    private readonly fiscalLookupService: FiscalLookupService,
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
    this.worker.on('error', (err) =>
      this.logger.error('AI Worker error', err),
    );
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }

  private async process(job: Job<AiJobData>) {
    const { taxCouponId, fileId } = job.data;
    try {
      await this.updateStatus(taxCouponId, TaxCouponStatus.AI_INITIATED);

      const { content, image, extension } = await this.getOcrAndImage(fileId);
      const prompt = this.buildPrompt(content);

      const thread = await this.createThread(prompt, extension, image);
      const run = await this.startRun(thread.id);
      const runStatus = await this.waitForCompletion(thread.id, run.id);

      if (runStatus.status !== 'completed') {
        throw new Error(`Assistant run failed with status: ${runStatus.status}`);
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

  private buildPrompt(text: string): string {
    return `
You are a JSON extraction engine. Extract the tax coupon information from the text below.

Only return a valid JSON object in this exact format:

{
  establishment: {
    name, cnpj, state_registration,
    address: {
      street, number, complement, neighborhood, city, state, postal_code
    }
  },
  document: {
    type, description, series, number, issue_date, access_key, consult_url, receipt_url
  },
  items: [
    { code, description, quantity, unit, unit_price, total_price, category_system }
  ],
  totals: {
    total_items, subtotal, total, payment_method
  },
  customer: {
    identified
  }
}

Text:
${text}`.trim();
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
    this.logger.verbose('Generated prompt', prompt);
    this.logger.verbose('Image URL', image);

    return this.openai.beta.threads.create({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: image } },
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
    let runStatus = await this.openai.beta.threads.runs.retrieve(threadId, runId);
    let attempts = 0;

    while (
      runStatus.status === 'queued' ||
      runStatus.status === 'in_progress' ||
      runStatus.status === 'requires_action'
    ) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      runStatus = await this.openai.beta.threads.runs.retrieve(threadId, runId);
      this.logger.verbose(`Waiting AI run... Attempt ${++attempts}, status: ${runStatus.status}`);
    }

    return runStatus;
  }

  private async fetchResponse(threadId: string): Promise<TaxCouponAiResponse> {
    const messages = await this.openai.beta.threads.messages.list(threadId);

    if (!messages.data.length) {
      throw new Error('No messages found from AI');
    }

    const lastMessage = messages.data[messages.data.length - 1];
    const block = lastMessage.content.find(isTextBlock);

    if (!block) {
      throw new Error('No valid text block found in AI response');
    }

    const text = block.text.value;
    this.logger.verbose('AI response raw text:', text);

    try {
      return JSON.parse(text) as TaxCouponAiResponse;
    } catch (err) {
      throw new Error(`Failed to parse AI response JSON: ${text}`);
    }
  }

  private async saveAiData(id: string, data: TaxCouponAiResponse) {
    this.logger.verbose('Parsed AI Data', JSON.stringify(data, null, 2));
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

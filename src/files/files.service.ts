// Dependencies
import { Injectable, Logger } from '@nestjs/common';
import { extname } from 'path';
import * as crypto from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

// DTO
import { CreateFileDto } from './dto/create-file.dto';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  private readonly s3 = new S3Client({
    region: process.env.AWS_REGION ?? 'region',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    },
  });

  async upload(file: Express.Multer.File): Promise<CreateFileDto> {
    try {
      const bucket = process.env.AWS_ACCESS_BUCKET ?? 'bucket';
      const folder = process.env.S3_FOLDER ?? 'cupons';
      const region = process.env.AWS_REGION;
      const baseUrl = `https://${bucket}.s3.${region}.amazonaws.com`;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const key = `${crypto.randomUUID()}-${file.originalname}`;
      const s3Key = `${folder}/${key}`;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await this.s3.send(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        new PutObjectCommand({
          Bucket: bucket,
          Key: s3Key,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          Body: file.buffer,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          ContentType: file.mimetype,
        }),
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      const extension = extname(file.originalname).replace('.', '');
      const url = `${baseUrl}/${s3Key}`;

      return {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        name: file.originalname || 'unknown',
        extension,
        baseUrl,
        folder,
        file: key,
        url,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        size: file.size,
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Failed to upload file', err);
      throw err;
    }
  }

  async download(folder: string, key: string): Promise<Buffer> {
    try {
      const bucket = process.env.AWS_ACCESS_BUCKET ?? 'bucket';
      const s3Key = `${folder}/${key}`;
      const response = await this.s3.send(
        new GetObjectCommand({ Bucket: bucket, Key: s3Key })
      );
      const stream = response.Body as Readable;
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer));
      }
      return Buffer.concat(chunks);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Failed to download file', err);
      throw err;
    }
  }
}

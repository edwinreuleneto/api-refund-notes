// Dependencies
import { Injectable, Logger } from '@nestjs/common';
import { extname } from 'path';
import * as crypto from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// DTO
import { CreateFileDto } from './dto/create-file.dto';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
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
      const region = this.s3.config.region as string;
      const baseUrl = `https://${bucket}.s3.${region}.amazonaws.com`;
      const key = `${crypto.randomUUID()}-${file.originalname}`;
      const s3Key = `${folder}/${key}`;

      await this.s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      const extension = extname(file.originalname).replace('.', '');
      const url = `${baseUrl}/${s3Key}`;

      return {
        name: file.originalname || 'unknown',
        extension,
        baseUrl,
        folder,
        file: key,
        url,
        size: file.size,
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Failed to upload file', err);
      throw err;
    }
  }
}

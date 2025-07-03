// Dependencies
import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import * as crypto from 'crypto';

// DTO
import { CreateFileDto } from './dto/create-file.dto';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  async upload(file: Express.Multer.File): Promise<CreateFileDto> {
    try {
      const bucket = process.env.AWS_ACCESS_BUCKET ?? 'bucket';
      const region = process.env.AWS_REGION ?? 'region';
      const folder = process.env.S3_FOLDER ?? 'cupons';
      const baseUrl = `https://${bucket}.s3.${region}.amazonaws.com`;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const key = `${crypto.randomUUID()}-${file.originalname}`;
      const uploadPath = join(process.cwd(), 'uploads', folder, key);

      await fs.mkdir(join(process.cwd(), 'uploads', folder), {
        recursive: true,
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      await fs.writeFile(uploadPath, file.buffer);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      const extension = extname(file.originalname).replace('.', '');
      const url = `${baseUrl}/${folder}/${key}`;

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
}

import { Injectable, Logger } from '@nestjs/common';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import * as crypto from 'crypto';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  async upload(file: Express.Multer.File): Promise<CreateFileDto> {
    try {
      const bucket = process.env.S3_BUCKET_NAME ?? 'bucket';
      const region = process.env.S3_REGION ?? 'region';
      const folder = process.env.S3_FOLDER ?? 'uploads';
      const baseUrl = `https://${bucket}.s3.${region}.amazonaws.com`;

      const key = `${crypto.randomUUID()}-${file.originalname}`;
      const uploadPath = join(process.cwd(), 'uploads', folder, key);
      await fs.mkdir(join(process.cwd(), 'uploads', folder), { recursive: true });
      await fs.writeFile(uploadPath, file.buffer);

      const extension = extname(file.originalname).replace('.', '');
      const url = `${baseUrl}/${folder}/${key}`;

      return {
        name: file.originalname,
        extension,
        baseUrl,
        folder,
        file: key,
        url,
        size: file.size,
      };
    } catch (error) {
      this.logger.error('Failed to upload file', error as Error);
      throw error;
    }
  }

  findAll() {
    return `This action returns all files`;
  }

  findOne(id: number) {
    return `This action returns a #${id} file`;
  }

  update(id: number, updateFileDto: UpdateFileDto) {
    return `This action updates a #${id} file`;
  }

  remove(id: number) {
    return `This action removes a #${id} file`;
  }
}

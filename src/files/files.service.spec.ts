import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';

describe('FilesService', () => {
  let service: FilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FilesService],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate a presigned url', async () => {
    process.env.AWS_ACCESS_BUCKET_INTERNAL = 'bucket';
    process.env.AWS_REGION_INTERNAL = 'us-east-2';
    process.env.AWS_ACCESS_KEY_ID_INTERNAL = 'key';
    process.env.AWS_SECRET_ACCESS_KEY_INTERNAL = 'secret';
    const url = await service.generatePresignedUrl('folder', 'file', 60);
    expect(typeof url).toBe('string');
  });
});

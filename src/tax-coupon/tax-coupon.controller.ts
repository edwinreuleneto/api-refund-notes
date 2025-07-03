// Dependencies
import { Controller, Post, UseInterceptors, UploadedFile, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiCreatedResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

// Services
import { TaxCouponService } from './tax-coupon.service';

// DTO
import { CreateTaxCouponDto } from './dto/create-tax-coupon.dto';
import { TaxCouponResponseDto } from './dto/tax-coupon-response.dto';

@ApiTags('Tax Coupon')
@Controller('tax-coupon')
export class TaxCouponController {
  private readonly logger = new Logger(TaxCouponController.name);
  constructor(private readonly taxCouponService: TaxCouponService) {}

  @Post()
  @ApiOperation({ summary: 'Upload tax coupon file' })
  @ApiBody({ type: CreateTaxCouponDto })
  @ApiCreatedResponse({ type: TaxCouponResponseDto })
  @UseInterceptors(FileInterceptor('file'))
  async create(@UploadedFile() file: Express.Multer.File): Promise<TaxCouponResponseDto> {
    try {
      return await this.taxCouponService.create(file);
    } catch (error) {
      this.logger.error('Failed to create tax coupon', error as Error);
      throw error;
    }
  }
}

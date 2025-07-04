// Dependencies
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Logger,
  Get,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

// Services
import { TaxCouponService } from './tax-coupon.service';

// DTO
import { CreateTaxCouponDto } from './dto/create-tax-coupon.dto';
import { TaxCouponResponseDto } from './dto/tax-coupon-response.dto';
import { TaxCouponDetailsDto } from './dto/tax-coupon-details.dto';

@ApiTags('Tax Coupon')
@Controller('tax-coupon')
export class TaxCouponController {
  private readonly logger = new Logger(TaxCouponController.name);
  constructor(private readonly taxCouponService: TaxCouponService) {}

  @Post()
  @ApiOperation({ summary: 'Upload tax coupon file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateTaxCouponDto })
  @ApiCreatedResponse({ type: TaxCouponResponseDto })
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateTaxCouponDto,
  ) {
    try {
      return this.taxCouponService.create(file, body.categories);
    } catch (error) {
      this.logger.error('Failed to create tax coupon', error as Error);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tax coupon by id' })
  getById(@Param('id') id: string): TaxCouponDetailsDto {
    try {
      return this.taxCouponService.getById(
        id,
      ) as unknown as TaxCouponDetailsDto;
    } catch (error) {
      this.logger.error('Failed to get tax coupon', error as Error);
      throw error;
    }
  }
}

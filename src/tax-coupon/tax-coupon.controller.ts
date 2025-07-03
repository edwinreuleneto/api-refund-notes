// Dependencies
import { Controller, Body, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';

// Services
import { TaxCouponService } from './tax-coupon.service';

// DTO
import { CreateTaxCouponDto } from './dto/create-tax-coupon.dto';

@ApiTags('Tax Coupon')
@Controller('tax-coupon')
export class CreateTaxCouponController {
  constructor(private readonly taxCouponService: TaxCouponService) {}

  @Put(':id')
  @ApiOperation({ summary: 'Update an cupon and its items' })
  @ApiParam({ name: 'id', type: 'string', description: 'Cupon UUID' })
  update(@Body() createTaxCouponDto: CreateTaxCouponDto) {
    return this.taxCouponService.update(createTaxCouponDto);
  }
}

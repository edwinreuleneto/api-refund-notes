import { PartialType } from '@nestjs/mapped-types';
import { CreateTaxCouponDto } from './create-tax-coupon.dto';

export class UpdateTaxCouponDto extends PartialType(CreateTaxCouponDto) {}

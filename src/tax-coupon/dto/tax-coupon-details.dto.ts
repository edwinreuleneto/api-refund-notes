import { ApiProperty } from '@nestjs/swagger';
import { TaxCouponResponseDto } from './tax-coupon-response.dto';

export class TaxCouponAiDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: 'object' })
  data!: Record<string, unknown>;

  @ApiProperty()
  createdAt!: Date;
}

export class TaxCouponDetailsDto extends TaxCouponResponseDto {
  @ApiProperty({ type: () => TaxCouponAiDto, required: false })
  ai?: TaxCouponAiDto | null;
}

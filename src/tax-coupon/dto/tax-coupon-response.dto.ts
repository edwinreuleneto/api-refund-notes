import { ApiProperty } from '@nestjs/swagger';
import { TaxCouponStatus } from '../enum/tax-coupon-status.enum';

export class TaxCouponResponseDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ enum: TaxCouponStatus })
  status!: TaxCouponStatus;

  @ApiProperty({ type: String })
  fileId!: string;

  @ApiProperty({ type: Date })
  createdAt!: Date;

  @ApiProperty({ type: Date })
  updatedAt?: Date;
}

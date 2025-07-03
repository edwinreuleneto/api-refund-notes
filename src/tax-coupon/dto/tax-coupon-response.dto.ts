import { ApiProperty } from '@nestjs/swagger';
import { TaxCouponStatus } from '../enum/tax-coupon-status.enum';

export class TaxCouponResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: TaxCouponStatus })
  status!: TaxCouponStatus;

  @ApiProperty()
  fileId!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt?: Date;
}

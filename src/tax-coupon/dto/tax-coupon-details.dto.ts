import { ApiProperty } from '@nestjs/swagger';
import { TaxCouponResponseDto } from './tax-coupon-response.dto';

export class TaxCouponAiEstablishmentDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ required: false })
  name?: string | null;

  @ApiProperty({ required: false })
  cnpj?: string | null;

  @ApiProperty({ required: false })
  stateRegistration?: string | null;

  @ApiProperty({ required: false })
  addressStreet?: string | null;

  @ApiProperty({ required: false })
  addressNumber?: string | null;

  @ApiProperty({ required: false })
  addressComplement?: string | null;

  @ApiProperty({ required: false })
  addressNeighborhood?: string | null;

  @ApiProperty({ required: false })
  addressCity?: string | null;

  @ApiProperty({ required: false })
  addressState?: string | null;

  @ApiProperty({ required: false })
  addressPostalCode?: string | null;
}

export class TaxCouponAiDocumentDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ required: false })
  type?: string | null;

  @ApiProperty({ required: false })
  description?: string | null;

  @ApiProperty({ required: false })
  series?: string | null;

  @ApiProperty({ required: false })
  number?: string | null;

  @ApiProperty({ required: false })
  issueDate?: Date | null;

  @ApiProperty({ required: false })
  accessKey?: string | null;

  @ApiProperty({ required: false })
  consultUrl?: string | null;

  @ApiProperty({ required: false })
  receiptUrl?: string | null;
}

export class TaxCouponAiItemDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ required: false })
  code?: string | null;

  @ApiProperty({ required: false })
  description?: string | null;

  @ApiProperty({ required: false })
  quantity?: number | null;

  @ApiProperty({ required: false })
  unit?: string | null;

  @ApiProperty({ required: false })
  unitPrice?: number | null;

  @ApiProperty({ required: false })
  totalPrice?: number | null;

  @ApiProperty({ required: false })
  categorySystem?: string | null;
}

export class TaxCouponAiTotalsDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ required: false })
  totalItems?: number | null;

  @ApiProperty({ required: false })
  subtotal?: number | null;

  @ApiProperty({ required: false })
  total?: number | null;

  @ApiProperty({ required: false })
  paymentMethod?: string | null;
}

export class TaxCouponAiCustomerDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ required: false })
  identified?: boolean | null;
}

export class TaxCouponAiDto {
  @ApiProperty({ type: String })
  id!: string;

  @ApiProperty({ type: () => TaxCouponAiEstablishmentDto, required: false })
  establishment?: TaxCouponAiEstablishmentDto | null;

  @ApiProperty({ type: () => TaxCouponAiDocumentDto, required: false })
  document?: TaxCouponAiDocumentDto | null;

  @ApiProperty({ type: () => [TaxCouponAiItemDto] })
  items!: TaxCouponAiItemDto[];

  @ApiProperty({ type: () => TaxCouponAiTotalsDto, required: false })
  totals?: TaxCouponAiTotalsDto | null;

  @ApiProperty({ type: () => TaxCouponAiCustomerDto, required: false })
  customer?: TaxCouponAiCustomerDto | null;

  @ApiProperty()
  createdAt!: Date;
}

export class TaxCouponDetailsDto extends TaxCouponResponseDto {
  @ApiProperty({ type: () => TaxCouponAiDto, required: false })
  details?: TaxCouponAiDto | null;
}

// Dependencies
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaxCouponDto {
  @ApiProperty({
    description: 'File to be uploaded',
    type: 'string',
    format: 'binary',
  })
  file: any;
}

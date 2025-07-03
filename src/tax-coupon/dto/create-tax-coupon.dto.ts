// Dependencies
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaxCouponDto {
  @ApiProperty({
    description: 'Arquivo a ser enviado',
    type: 'string',
    format: 'binary',
  })
  file!: Express.Multer.File;
}

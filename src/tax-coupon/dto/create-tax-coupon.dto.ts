// Dependencies
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsString } from 'class-validator';

export class CreateTaxCouponDto {
  @ApiProperty({
    description: 'Arquivo a ser enviado',
    type: 'string',
    format: 'binary',
  })
  file!: Express.Multer.File;

  @ApiProperty({
    description: 'Categorias de produtos',
    type: [String],
    required: false,
  })
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  @IsArray()
  @IsString({ each: true })
  categories?: string[];
}

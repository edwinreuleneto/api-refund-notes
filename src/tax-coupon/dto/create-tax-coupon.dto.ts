// Dependencies
import { ApiProperty } from '@nestjs/swagger';
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
  @IsArray()
  @IsString({ each: true })
  categories?: string[];
}

import { Module } from '@nestjs/common';
import { FiscalLookupService } from './fiscal-lookup.service';

@Module({
  providers: [FiscalLookupService],
  exports: [FiscalLookupService],
})
export class FiscalLookupModule {}

import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class FiscalLookupService {
  private readonly logger = new Logger(FiscalLookupService.name);

  async consult(code: string): Promise<unknown> {
    try {
      const apiUrl = process.env.FISCAL_COUPON_API_URL ?? '';
      const url = `${apiUrl}?code=${encodeURIComponent(code)}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to consult fiscal coupon service', error as Error);
      throw error;
    }
  }
}

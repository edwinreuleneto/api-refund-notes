export interface TaxCouponAddress {
  street: string;
  number: string;
  complement: string;
  neighborhood: string | null;
  city: string;
  state: string;
  postal_code: string | null;
}

export interface TaxCouponEstablishment {
  name: string;
  cnpj: string;
  state_registration: string;
  address: TaxCouponAddress;
}

export interface TaxCouponDocument {
  type: string;
  description: string;
  series: string;
  number: string;
  issue_date: string;
  access_key: string;
  consult_url: string;
  receipt_url: string;
}

export interface TaxCouponItem {
  code: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  category_system: string;
}

export interface TaxCouponTotals {
  total_items: number;
  subtotal: number;
  total: number;
  payment_method: string;
}

export interface TaxCouponCustomer {
  identified: boolean;
}

export interface TaxCouponAiResponse {
  establishment: TaxCouponEstablishment;
  document: TaxCouponDocument;
  items: TaxCouponItem[];
  totals: TaxCouponTotals;
  customer: TaxCouponCustomer;
}

/**
 * Authoritative pricing catalog.
 *
 * The checkout API uses this as the SOURCE OF TRUTH for price/credits/duration.
 * Any price, credits, or plan info sent by the client is IGNORED — only the
 * product_id is honored, and everything else is looked up here.
 *
 * To change pricing, edit this file and redeploy. Admin UI cannot alter prices.
 */

import { PaymentInterval, PaymentType } from '@/core/payment/types';

export type PricingPlanInfo = {
  name: string;
  interval: PaymentInterval;
  intervalCount: number;
};

export type PricingProduct = {
  productId: string;
  productName: string;
  planName: string;
  description: string;
  type: PaymentType;
  priceInCents: number;
  currency: string;
  /**
   * Price in fen for CNY-only providers (Alipay, WeChat Pay) when `currency`
   * isn't CNY. Without it those providers refuse the product — the amount is
   * never reused across currencies.
   */
  cnyPriceInCents?: number;
  credits: number;
  creditsValidDays?: number;
  plan?: PricingPlanInfo;
};

/**
 * SITE: 积分包（一次性付款）。1 积分 = USD_PER_CREDIT 美元（config/ai/models.ts），
 * 大包送得多。价格页直接读这里，改价格只改这一处。
 * key 必须和 product_id 一致；用 Creem 时在后台把这些 id 映射到 Creem 的商品
 */
export const pricingCatalog: Record<string, PricingProduct> = {
  credits_500: {
    productId: 'credits_500',
    productName: 'Starter',
    planName: 'Starter',
    description: '500 credits',
    type: PaymentType.ONE_TIME,
    priceInCents: 499,
    currency: 'usd',
    credits: 500,
  },
  credits_1100: {
    productId: 'credits_1100',
    productName: 'Popular',
    planName: 'Popular',
    description: '1,100 credits',
    type: PaymentType.ONE_TIME,
    priceInCents: 999,
    currency: 'usd',
    credits: 1100,
  },
  credits_2500: {
    productId: 'credits_2500',
    productName: 'Big pack',
    planName: 'Big pack',
    description: '2,500 credits',
    type: PaymentType.ONE_TIME,
    priceInCents: 1999,
    currency: 'usd',
    credits: 2500,
  },
};

export function getPricingProduct(productId: string): PricingProduct | null {
  if (!productId) return null;
  return pricingCatalog[productId] ?? null;
}

export function listPricingProducts(): PricingProduct[] {
  return Object.values(pricingCatalog);
}

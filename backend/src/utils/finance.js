export const PLATFORM_CURRENCY = (process.env.PLATFORM_CURRENCY || 'USD').toUpperCase();
export const SYSTEMS_PAYMENT_CHARGE_PERCENT = Number(process.env.SYSTEMS_PAYMENT_CHARGE_PERCENT || 5);
export const SYSTEMS_PAYMENT_CHARGE_DESCRIPTION = process.env.SYSTEMS_PAYMENT_CHARGE_DESCRIPTION || 'Platform Infrastructure & Plugin Maintenance Allocation';
export const PAYSTACK_PASS_THROUGH_FEES = String(process.env.PAYSTACK_PASS_THROUGH_FEES || 'true').toLowerCase() === 'true';
export const PAYSTACK_PROCESSING_FEE_PERCENT = Number(process.env.PAYSTACK_PROCESSING_FEE_PERCENT || 3.9);
export const PAYSTACK_PROCESSING_FEE_FIXED = Number(process.env.PAYSTACK_PROCESSING_FEE_FIXED || 0.10);
export const PLATFORM_SERVICE_FEE_LABEL = process.env.PLATFORM_SERVICE_FEE_LABEL || 'Secure platform processing';
export const COMPANY_BANK_NAME = process.env.TYNA_COMPANY_BANK_NAME || 'Tyna Systems';
export const COMPANY_ACCOUNT_NUMBER = process.env.TYNA_COMPANY_ACCOUNT_NUMBER || '';
export const COMPANY_ACCOUNT_NAME = process.env.TYNA_COMPANY_ACCOUNT_NAME || 'Tyna Systems';

export function moneyRound(value = 0) {
  return Math.round(Number(value || 0) * 100) / 100;
}

export function toSubunit(amount = 0) {
  return Math.round(Number(amount || 0) * 100);
}

export function paystackFeeMajor(order) {
  return moneyRound(Number(order?.paystackData?.fees || order?.paystackData?.fee || 0) / 100);
}

export function estimatedPaystackFee(amount = 0) {
  const major = Number(amount || 0);
  return moneyRound((major * PAYSTACK_PROCESSING_FEE_PERCENT) / 100 + PAYSTACK_PROCESSING_FEE_FIXED);
}

export function customerChargeAmount(baseAmount = 0) {
  const base = moneyRound(baseAmount);
  if (!PAYSTACK_PASS_THROUGH_FEES) return base;
  const pct = Math.min(Math.max(PAYSTACK_PROCESSING_FEE_PERCENT, 0), 95) / 100;
  const gross = (base + PAYSTACK_PROCESSING_FEE_FIXED) / (1 - pct);
  return moneyRound(gross);
}

export function systemsPaymentChargeAmount(amount = 0) {
  return moneyRound((Number(amount || 0) * SYSTEMS_PAYMENT_CHARGE_PERCENT) / 100);
}

export function companyNetAmount(amount = 0) {
  return moneyRound(Number(amount || 0) - systemsPaymentChargeAmount(amount));
}

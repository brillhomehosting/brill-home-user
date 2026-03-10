export const DISCOUNT_PROGRAM_START = '2026-03-02';
export const DISCOUNT_PROGRAM_END   = '2026-03-05';

const _discountEnv = process.env.NEXT_PUBLIC_DISCOUNT_PROGRAM_PERCENT;
export const DISCOUNT_PROGRAM_PERCENT: number =
  _discountEnv && !isNaN(Number(_discountEnv)) ? Number(_discountEnv) / 100 : 0.15;

export const COMBO_DISCOUNTS = [
  { minSlots: 3, percent: 0.10 },
  { minSlots: 2, percent: 0.05 },
];

export const SAME_DAY_4_SLOT_BONUS = 250_000;
export const WEEKDAY_SLOT_DISCOUNT = 20_000;

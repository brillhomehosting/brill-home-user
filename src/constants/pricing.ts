export const DISCOUNT_PROGRAM_START = '2026-03-02';
export const DISCOUNT_PROGRAM_END   = '2026-03-05';

const _discountEnv = process.env.NEXT_PUBLIC_DISCOUNT_PROGRAM_PERCENT;
export const DISCOUNT_PROGRAM_PERCENT: number =
  _discountEnv && !isNaN(Number(_discountEnv)) ? Number(_discountEnv) / 100 : 0.15;

export const COMBO_DISCOUNTS = [
  { minSlots: 4, percent: 0.20 },
  { minSlots: 3, percent: 0.10 },
  { minSlots: 2, percent: 0.05 },
];

export const WEEKDAY_SLOT_DISCOUNT = 20_000;
export const WEEKDAY_PROGRAM_START = '2026-04-01';
export const WEEKDAY_PROGRAM_END = '2026-04-24';

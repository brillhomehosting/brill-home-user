import { COMBO_DISCOUNTS, DISCOUNT_PROGRAM_END, DISCOUNT_PROGRAM_PERCENT, DISCOUNT_PROGRAM_START, WEEKDAY_SLOT_DISCOUNT } from '@/constants/pricing';

export interface PricingBreakdown {
	basePrice: number;
	hasDiscountProgram: boolean;
	discountPercent: number;
	discountAmount: number;
	comboPercent: number;
	comboDiscount: number;
	weekdayDiscountAmount: number;
	hasWeekdayDiscount: boolean;
	totalAmount: number;
	savings: number;
}

/** Returns true if the given YYYY-MM-DD string falls within the discount program range. */
export function isInDiscountProgram(dateStr: string): boolean {
	return dateStr >= DISCOUNT_PROGRAM_START && dateStr <= DISCOUNT_PROGRAM_END;
}

/** Returns the combo discount percent for a given slot count (0 if no discount). */
export function getComboPercent(slotCount: number): number {
	for (const tier of COMBO_DISCOUNTS) {
		if (slotCount >= tier.minSlots) return tier.percent;
	}
	return 0;
}

export function isWeekday(dateStr: string): boolean {
	const date = new Date(`${dateStr}T00:00:00`);
	const day = date.getDay();
	return day >= 1 && day <= 5;
}

export function isInCurrentWeek(dateStr: string): boolean {
	const date = new Date(`${dateStr}T00:00:00`);
	const today = new Date();
	const currentDay = today.getDay();
	const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

	const startOfWeek = new Date(today);
	startOfWeek.setHours(0, 0, 0, 0);
	startOfWeek.setDate(today.getDate() + diffToMonday);

	const endOfWeek = new Date(startOfWeek);
	endOfWeek.setDate(startOfWeek.getDate() + 6);
	endOfWeek.setHours(23, 59, 59, 999);

	return date >= startOfWeek && date <= endOfWeek;
}

export function isEligibleForWeeklyDiscount(dateStr: string): boolean {
	return isWeekday(dateStr) && isInCurrentWeek(dateStr);
}

/** Full pricing breakdown from raw slot prices and selected slot keys.
 *
 * Slots are split into two independent groups:
 * - Discount-program slots (dates within the program range): program % applied to their subtotal only.
 * - Combo discount is applied by total selected slot count across the booking.
 * - Weekday program discount applies once per booking if any selected slot is eligible.
 */
export function calculatePricing(
	slotPrices: Map<string, number>,
	selectedSlots: Set<string>,
): PricingBreakdown {
	let discountProgramBasePrice = 0;
	let basePrice = 0;
	let hasWeekdayDiscount = false;

	selectedSlots.forEach(slotKey => {
		const dateStr = slotKey.split('::')[1];
		const price = slotPrices.get(slotKey) ?? 0;
		if (dateStr && isEligibleForWeeklyDiscount(dateStr)) {
			hasWeekdayDiscount = true;
		}
		basePrice += price;
		if (dateStr && isInDiscountProgram(dateStr)) {
			discountProgramBasePrice += price;
		}
	});

	const hasDiscountProgram = discountProgramBasePrice > 0;

	// Discount program: only on discount-program-day slots
	const discountPercent = hasDiscountProgram ? DISCOUNT_PROGRAM_PERCENT : 0;
	const discountAmount = Math.round(discountProgramBasePrice * discountPercent);

	const comboPercent = selectedSlots.size > 0 ? getComboPercent(selectedSlots.size) : 0;
	const comboDiscount = Math.round(basePrice * comboPercent);
	const subtotalAfterCombo = basePrice - discountAmount - comboDiscount;
	const weekdayDiscountAmount = hasWeekdayDiscount ? Math.min(WEEKDAY_SLOT_DISCOUNT, subtotalAfterCombo) : 0;

	const totalAmount = subtotalAfterCombo - weekdayDiscountAmount;
	const savings = discountAmount + comboDiscount + weekdayDiscountAmount;

	return {
		basePrice,
		hasDiscountProgram,
		discountPercent,
		discountAmount,
		comboPercent,
		comboDiscount,
		weekdayDiscountAmount,
		hasWeekdayDiscount,
		totalAmount,
		savings,
	};
}

/** Convert raw VND to display string, rounded to nearest integer. 200000 → "200k", 228650 → "229k" */
export function toKDisplay(amountVND: number): string {
	return `${Math.round(amountVND / 1000)}k`;
}

/** Badge label for combo discount, e.g. "Combo -5%". Returns null if no discount. */
export function comboBadgeLabel(comboPercent: number): string | null {
	if (comboPercent <= 0) return null;
	return `Combo -${Math.round(comboPercent * 100)}%`;
}

export function getSavingsBadgeLabel(pricing: PricingBreakdown): string | null {
	const hasPromo = pricing.discountPercent > 0;
	const hasCombo = pricing.comboPercent > 0;
	const hasWeekday = pricing.weekdayDiscountAmount > 0;
	const activeDiscountCount = [hasPromo, hasCombo, hasWeekday].filter(Boolean).length;

	if (activeDiscountCount === 0) return null;
	if (activeDiscountCount > 1) return `Nhiều ưu đãi · Tiết kiệm ${toKDisplay(pricing.savings)}`;
	if (hasPromo) return `Khuyến mãi -${Math.round(pricing.discountPercent * 100)}%`;
	if (hasCombo) return `Combo -${Math.round(pricing.comboPercent * 100)}%`;
	return `ƯĐ tuần -${toKDisplay(pricing.weekdayDiscountAmount)}`;
}

import { COMBO_DISCOUNTS, DISCOUNT_PROGRAM_END, DISCOUNT_PROGRAM_PERCENT, DISCOUNT_PROGRAM_START, SAME_DAY_4_SLOT_BONUS, WEEKDAY_SLOT_DISCOUNT } from '@/constants/pricing';

export interface PricingBreakdown {
	basePrice: number;
	hasDiscountProgram: boolean;
	discountPercent: number;
	discountAmount: number;
	comboPercent: number;
	comboDiscount: number;
	sameDayFourSlotBonus: number;
	sameDayFourSlotCount: number;
	weekdayDiscountAmount: number;
	weekdayDiscountSlotCount: number;
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

/**
 * Returns the number of calendar days that have 4 or more selected slots.
 * Key format: roomId::YYYY-MM-DD::slotId
 */
export function countSameDayFourSlotDays(selectedSlots: Set<string>): number {
	const countByDate = new Map<string, number>();
	selectedSlots.forEach(key => {
		const dateStr = key.split('::')[1];
		if (dateStr) countByDate.set(dateStr, (countByDate.get(dateStr) ?? 0) + 1);
	});
	let days = 0;
	for (const count of countByDate.values()) {
		if (count >= 4) days++;
	}
	return days;
}

/** Backward-compatible helper: returns true if any single day has 4+ slots. */
export function hasSameDayFourSlots(selectedSlots: Set<string>): boolean {
	return countSameDayFourSlotDays(selectedSlots) > 0;
}

/** Full pricing breakdown from raw slot prices and selected slot keys.
 *
 * Slots are split into two independent groups:
 * - Discount-program slots (dates within the program range): program % applied to their subtotal only.
 * - Regular slots (all other dates): combo % + optional same-day-4-slot bonus applied to their subtotal only.
 * Both discounts can be active simultaneously when the user has slots from both day types.
 */
export function calculatePricing(
	slotPrices: Map<string, number>,
	selectedSlots: Set<string>,
): PricingBreakdown {
	let regularBasePrice = 0;
	let discountProgramBasePrice = 0;
	const regularSlots = new Set<string>();
	let weekdayDiscountSlotCount = 0;

	selectedSlots.forEach(slotKey => {
		const dateStr = slotKey.split('::')[1];
		const price = slotPrices.get(slotKey) ?? 0;
		if (dateStr && isEligibleForWeeklyDiscount(dateStr)) {
			weekdayDiscountSlotCount += 1;
		}
		if (dateStr && isInDiscountProgram(dateStr)) {
			discountProgramBasePrice += price;
		} else {
			regularBasePrice += price;
			regularSlots.add(slotKey);
		}
	});

	const basePrice = regularBasePrice + discountProgramBasePrice;
	const hasDiscountProgram = discountProgramBasePrice > 0;

	// Discount program: only on discount-program-day slots
	const discountPercent = hasDiscountProgram ? DISCOUNT_PROGRAM_PERCENT : 0;
	const discountAmount = Math.round(discountProgramBasePrice * discountPercent);

	// Combo: only on regular slots, sized by their count
	const comboPercent = regularSlots.size > 0 ? getComboPercent(regularSlots.size) : 0;
	const comboDiscount = Math.round(regularBasePrice * comboPercent);

	// Same-day 4-slot bonus: applies per qualifying day (each day with 4+ slots → 250k)
	const sameDayFourSlotCount = countSameDayFourSlotDays(selectedSlots);
	const sameDayFourSlotBonus = sameDayFourSlotCount * SAME_DAY_4_SLOT_BONUS;
	const weekdayDiscountAmount = weekdayDiscountSlotCount * WEEKDAY_SLOT_DISCOUNT;

	const totalAmount = basePrice - discountAmount - comboDiscount - sameDayFourSlotBonus - weekdayDiscountAmount;
	const savings = discountAmount + comboDiscount + sameDayFourSlotBonus + weekdayDiscountAmount;

	return {
		basePrice,
		hasDiscountProgram,
		discountPercent,
		discountAmount,
		comboPercent,
		comboDiscount,
		sameDayFourSlotBonus,
		sameDayFourSlotCount,
		weekdayDiscountAmount,
		weekdayDiscountSlotCount,
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
	const hasSameDayBonus = pricing.sameDayFourSlotBonus > 0;
	const activeDiscountCount = [hasPromo, hasCombo, hasWeekday, hasSameDayBonus].filter(Boolean).length;

	if (activeDiscountCount === 0) return null;
	if (activeDiscountCount > 1) return `Nhiều ưu đãi · Tiết kiệm ${toKDisplay(pricing.savings)}`;
	if (hasPromo) return `Khuyến mãi -${Math.round(pricing.discountPercent * 100)}%`;
	if (hasCombo) return `Combo -${Math.round(pricing.comboPercent * 100)}%`;
	if (hasWeekday) return `Ngày thường -${toKDisplay(pricing.weekdayDiscountAmount)}`;
	return `Combo ngày -${toKDisplay(pricing.sameDayFourSlotBonus)}`;
}

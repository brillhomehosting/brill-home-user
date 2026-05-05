import type {
	ActiveDiscountProgram,
	AppliedProgramDiscount,
	ComboDiscountTier,
	PricingPreviewBreakdown,
	PricingSelectedSlot,
} from "@/types/pricing";

export interface CalculatePricingParams {
	selectedSlots: PricingSelectedSlot[];
	comboDiscounts: ComboDiscountTier[];
	activePrograms: ActiveDiscountProgram[];
	roomId: string;
	roomType?: string | null;
}

function toPercentValue(value: number): number {
	if (!Number.isFinite(value)) return 0;
	return value <= 1 ? value * 100 : value;
}

function toPercentRate(value: number): number {
	return toPercentValue(value) / 100;
}

function sumPrices(slots: PricingSelectedSlot[]): number {
	return slots.reduce((total, slot) => total + slot.price, 0);
}

export function isWeekday(dateStr: string): boolean {
	const date = new Date(`${dateStr}T00:00:00`);
	const day = date.getDay();
	return day >= 1 && day <= 5;
}

function matchesProgram(
	program: ActiveDiscountProgram,
	params: CalculatePricingParams,
	selectedDate: string,
): boolean {
	if (program.status !== "ACTIVE") return false;
	if (selectedDate < program.startDate || selectedDate > program.endDate) return false;

	switch (program.type) {
		case "ALL":
			return true;
		case "ROOM":
			return Boolean(program.targetRoomId && program.targetRoomId === params.roomId);
		case "ROOM_TYPE":
			return Boolean(program.targetRoomType && params.roomType && program.targetRoomType === params.roomType);
		case "WEEK_DAY":
			if (program.targetWeekDaySlot === null) return false;
			return isWeekday(selectedDate) === program.targetWeekDaySlot;
		case "SLOT_TYPE":
			if (program.targetOvernightSlot === null) return false;
			return params.selectedSlots.some((slot) => slot.isOvernight === program.targetOvernightSlot);
		default:
			return false;
	}
}

function getProgramMatchingSlots(
	program: ActiveDiscountProgram,
	slots: PricingSelectedSlot[],
): PricingSelectedSlot[] {
	if (program.type === "SLOT_TYPE") {
		if (program.targetOvernightSlot === null) return [];
		return slots.filter((slot) => slot.isOvernight === program.targetOvernightSlot);
	}
	return slots;
}

function calculateProgramDiscountAmount(
	program: ActiveDiscountProgram,
	slots: PricingSelectedSlot[],
): number {
	const matchedSlots = getProgramMatchingSlots(program, slots);
	if (matchedSlots.length === 0) return 0;

	if (program.discountType === "FIXED_AMOUNT") {
		return Math.max(0, Math.round(program.discountValue * matchedSlots.length));
	}

	const programBase = sumPrices(matchedSlots);
	return Math.max(0, Math.round(programBase * toPercentRate(program.discountValue)));
}

function resolveBestProgram(params: CalculatePricingParams): AppliedProgramDiscount | null {
	const selectedDate = params.selectedSlots[0]?.date;
	if (!selectedDate) return null;

	let best: AppliedProgramDiscount | null = null;
	for (const program of params.activePrograms) {
		if (!matchesProgram(program, params, selectedDate)) continue;
		const discountAmount = calculateProgramDiscountAmount(program, params.selectedSlots);
		if (discountAmount <= 0) continue;
		if (!best || discountAmount > best.discountAmount) {
			best = { program, discountAmount };
		}
	}

	return best;
}

function resolveComboTier(
	slotCount: number,
	comboDiscounts: ComboDiscountTier[],
): ComboDiscountTier | null {
	if (slotCount <= 0 || comboDiscounts.length === 0) return null;
	const sorted = [...comboDiscounts].sort((a, b) => b.minSlots - a.minSlots);
	return sorted.find((tier) => slotCount >= tier.minSlots) ?? null;
}

export function calculatePricing({
	selectedSlots,
	comboDiscounts,
	activePrograms,
	roomId,
	roomType,
}: CalculatePricingParams): PricingPreviewBreakdown {
	if (selectedSlots.length === 0) {
		return {
			basePrice: 0,
			programDiscountAmount: 0,
			comboPercent: 0,
			comboPercentAmount: 0,
			comboFlatDiscount: 0,
			comboDiscountAmount: 0,
			totalAmount: 0,
			savings: 0,
			appliedProgram: null,
			appliedComboTier: null,
		};
	}

	const basePrice = sumPrices(selectedSlots);
	const bestProgram = resolveBestProgram({
		selectedSlots,
		comboDiscounts,
		activePrograms,
		roomId,
		roomType,
	});
	const programDiscountAmount = Math.min(basePrice, bestProgram?.discountAmount ?? 0);
	const afterProgramPrice = Math.max(0, basePrice - programDiscountAmount);

	const comboTier = resolveComboTier(selectedSlots.length, comboDiscounts);
	const comboPercent = comboTier ? toPercentValue(comboTier.discountPercent) : 0;
	const comboFlatDiscount = comboTier?.flatDiscount ?? 0;
	const comboPercentAmount = Math.round(afterProgramPrice * toPercentRate(comboPercent));
	const comboDiscountAmount = Math.min(
		afterProgramPrice,
		Math.max(0, comboPercentAmount + comboFlatDiscount),
	);

	const totalAmount = afterProgramPrice - comboDiscountAmount;
	const savings = programDiscountAmount + comboDiscountAmount;

	return {
		basePrice,
		programDiscountAmount,
		comboPercent,
		comboPercentAmount,
		comboFlatDiscount,
		comboDiscountAmount,
		totalAmount,
		savings,
		appliedProgram: bestProgram,
		appliedComboTier: comboTier,
	};
}

/** Convert raw VND to display string, rounded to nearest integer. 200000 -> "200k", 228650 -> "229k" */
export function toKDisplay(amountVND: number): string {
	return `${Math.round(amountVND / 1000)}k`;
}

/** Badge label for combo discount, e.g. "Combo -5%". Returns null if no discount. */
export function comboBadgeLabel(comboPercent: number): string | null {
	if (comboPercent <= 0) return null;
	return `Combo -${Math.round(comboPercent)}%`;
}

export function getSavingsBadgeLabel(pricing: PricingPreviewBreakdown): string | null {
	const hasProgram = pricing.programDiscountAmount > 0;
	const hasCombo = pricing.comboDiscountAmount > 0;
	const activeDiscountCount = [hasProgram, hasCombo].filter(Boolean).length;

	if (activeDiscountCount === 0) return null;
	if (activeDiscountCount > 1) return `Nhiều ưu đãi · Tiết kiệm ${toKDisplay(pricing.savings)}`;
	if (hasProgram && pricing.appliedProgram) return pricing.appliedProgram.program.name;
	if (hasCombo) return comboBadgeLabel(pricing.comboPercent);
	return null;
}

export function getComboNotification(
	slotCount: number,
	comboPercent: number,
): string | null {
	if (slotCount < 2 || comboPercent <= 0) return null;
	return `Đặt ${slotCount} khung giờ liên tiếp - Giảm ${Math.round(comboPercent)}%`;
}

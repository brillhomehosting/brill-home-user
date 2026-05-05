import type {
	ActiveDiscountProgram,
	AppliedProgramDiscount,
	ComboDiscountTier,
	HolidaySurchargeInfo,
	PricingDailyBreakdown,
	PricingPreviewBreakdown,
	PricingSelectedSlot,
	SurchargeType,
} from "@/types/pricing";

export interface CalculatePricingParams {
	selectedSlots: PricingSelectedSlot[];
	comboDiscounts: ComboDiscountTier[];
	activePrograms: ActiveDiscountProgram[];
	holidayByDate?: Map<string, HolidaySurchargeInfo>;
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

function isSameWeekdayType(dateStr: string, isWeekdayTarget: boolean): boolean {
	const date = new Date(`${dateStr}T00:00:00`);
	const day = date.getDay();
	const isWeekday = day >= 1 && day <= 5;
	return isWeekday === isWeekdayTarget;
}

function getProgramPriority(type: ActiveDiscountProgram["type"]): number {
	switch (type) {
		case "ROOM":
			return 5;
		case "WEEK_DAY":
			return 4;
		case "ROOM_TYPE":
			return 3;
		case "SLOT_TYPE":
			return 2;
		case "ALL":
		default:
			return 1;
	}
}

function getMatchedSlots(
	program: ActiveDiscountProgram,
	daySlots: PricingSelectedSlot[],
	date: string,
	roomId: string,
	roomType?: string | null,
): PricingSelectedSlot[] {
	switch (program.type) {
		case "ROOM":
			if (program.targetRoomId && program.targetRoomId !== roomId) return [];
			return [...daySlots];
		case "ROOM_TYPE":
			if (!roomType) return [];
			if (program.targetRoomType && program.targetRoomType !== roomType) return [];
			return [...daySlots];
		case "WEEK_DAY":
			{
				const targetWeekDay = program.targetWeekDay;
				if (targetWeekDay === null || targetWeekDay === undefined) return [];
				return isSameWeekdayType(date, targetWeekDay) ? [...daySlots] : [];
			}
		case "SLOT_TYPE":
			if (program.targetOvernightSlot === null || program.targetOvernightSlot === undefined) return [];
			return daySlots.filter((slot) => slot.isOvernight === program.targetOvernightSlot);
		case "ALL":
		default:
			return [...daySlots];
	}
}

function applyHolidaySurcharge(
	basePrice: number,
	surcharge: HolidaySurchargeInfo | undefined,
): { holidaySurchargeAmount: number; priceAfterSurcharge: number; isHoliday: boolean; holidayName: string | null } {
	if (!surcharge?.isHoliday || surcharge.surchargeValue <= 0) {
		return {
			holidaySurchargeAmount: 0,
			priceAfterSurcharge: basePrice,
			isHoliday: false,
			holidayName: surcharge?.holidayName ?? null,
		};
	}

	let holidaySurchargeAmount = 0;
	const surchargeType = (surcharge.surchargeType || "PERCENTAGE") as SurchargeType;
	if (surchargeType === "PERCENTAGE") {
		holidaySurchargeAmount = Math.round(basePrice * toPercentRate(surcharge.surchargeValue));
	} else {
		holidaySurchargeAmount = Math.max(0, Math.round(surcharge.surchargeValue));
	}

	return {
		holidaySurchargeAmount,
		priceAfterSurcharge: basePrice + holidaySurchargeAmount,
		isHoliday: true,
		holidayName: surcharge.holidayName ?? null,
	};
}

function resolveBestProgramForDate(
	daySlots: PricingSelectedSlot[],
	date: string,
	roomId: string,
	roomType: string | null | undefined,
	programs: ActiveDiscountProgram[],
	holidayRate: number,
	priceAfterSurcharge: number,
): AppliedProgramDiscount | null {
	if (!programs.length || !daySlots.length) return null;

	const candidates = programs
		.filter((program) => program.status === "ACTIVE")
		.filter((program) => date >= program.startDate && date <= program.endDate)
		.map((program) => {
			const matchedSlots = getMatchedSlots(program, daySlots, date, roomId, roomType);
			if (!matchedSlots.length) return null;

			const matchedPriceAfterSurcharge = matchedSlots.reduce((sum, slot) => {
				const slotAfterSurcharge = Math.round(slot.price * (1 + holidayRate));
				return sum + slotAfterSurcharge;
			}, 0);

			let discountAmount = 0;
			if (program.discountType === "PERCENTAGE") {
				if (program.type === "SLOT_TYPE") {
					discountAmount = Math.round(matchedPriceAfterSurcharge * toPercentRate(program.discountValue));
				} else {
					discountAmount = Math.round(priceAfterSurcharge * toPercentRate(program.discountValue));
				}
			} else {
				discountAmount = Math.round(program.discountValue * matchedSlots.length);
			}

			return {
				program,
				priority: getProgramPriority(program.type),
				discountAmount: Math.max(0, discountAmount),
			};
		})
		.filter((item): item is { program: ActiveDiscountProgram; priority: number; discountAmount: number } => Boolean(item))
		.filter((item) => item.discountAmount > 0);

	if (!candidates.length) return null;

	candidates.sort((a, b) => {
		if (b.priority !== a.priority) return b.priority - a.priority;
		return b.discountAmount - a.discountAmount;
	});

	const winner = candidates[0];
	if (!winner) return null;

	return {
		program: winner.program,
		discountAmount: Math.min(priceAfterSurcharge, winner.discountAmount),
	};
}

function resolveComboTier(slotCount: number, tiers: ComboDiscountTier[]): ComboDiscountTier | null {
	if (slotCount <= 0 || !tiers.length) return null;
	const sorted = [...tiers].sort((a, b) => b.minSlots - a.minSlots);
	return sorted.find((tier) => slotCount >= tier.minSlots) ?? null;
}

function buildDailyBreakdown({
	date,
	daySlots,
	comboDiscounts,
	holidayInfo,
	dayPrograms,
	roomId,
	roomType,
}: {
	date: string;
	daySlots: PricingSelectedSlot[];
	comboDiscounts: ComboDiscountTier[];
	holidayInfo: HolidaySurchargeInfo | undefined;
	dayPrograms: ActiveDiscountProgram[];
	roomId: string;
	roomType?: string | null;
}): PricingDailyBreakdown {
	const basePrice = sumPrices(daySlots);

	let holidayRate = 0;
	if (holidayInfo?.isHoliday) {
		if (holidayInfo.surchargeType === "PERCENTAGE") {
			holidayRate = toPercentRate(holidayInfo.surchargeValue);
		} else if (basePrice > 0) {
			holidayRate = holidayInfo.surchargeValue / basePrice;
		}
	}
	const holidayStep = applyHolidaySurcharge(basePrice, holidayInfo);
	const priceAfterSurcharge = holidayStep.priceAfterSurcharge;

	const appliedProgram = resolveBestProgramForDate(
		daySlots,
		date,
		roomId,
		roomType,
		dayPrograms,
		holidayRate,
		priceAfterSurcharge,
	);

	const programDiscountAmount = Math.min(priceAfterSurcharge, appliedProgram?.discountAmount ?? 0);
	const priceAfterDiscount = Math.max(0, priceAfterSurcharge - programDiscountAmount);

	const slotCount = daySlots.length;
	const comboTier = resolveComboTier(slotCount, comboDiscounts);
	const comboPercent = comboTier ? toPercentValue(comboTier.discountPercent) : 0;
	const comboFlatDiscount = comboTier?.flatDiscount ?? 0;
	const comboPercentAmount = Math.round(priceAfterDiscount * toPercentRate(comboPercent));
	const comboDiscountAmount = Math.min(
		priceAfterDiscount,
		Math.max(0, comboPercentAmount + comboFlatDiscount),
	);
	const dailyTotal = Math.max(0, priceAfterDiscount - comboDiscountAmount);

	return {
		date,
		basePrice,
		isHoliday: holidayStep.isHoliday,
		holidayName: holidayStep.holidayName,
		holidaySurchargeAmount: holidayStep.holidaySurchargeAmount,
		priceAfterSurcharge,
		appliedProgram,
		programDiscountAmount,
		priceAfterDiscount,
		slotCount,
		comboPercent,
		comboPercentAmount,
		comboFlatDiscount,
		comboDiscountAmount,
		appliedComboTier: comboTier ?? null,
		dailyTotal,
	};
}

export function calculatePricing({
	selectedSlots,
	comboDiscounts,
	activePrograms,
	holidayByDate,
	roomId,
	roomType,
}: CalculatePricingParams): PricingPreviewBreakdown {
	if (selectedSlots.length === 0) {
		return {
			basePrice: 0,
			holidaySurchargeAmount: 0,
			programDiscountAmount: 0,
			comboPercent: 0,
			comboPercentAmount: 0,
			comboFlatDiscount: 0,
			comboDiscountAmount: 0,
			totalAmount: 0,
			savings: 0,
			appliedProgram: null,
			appliedComboTier: null,
			dailyBreakdown: [],
		};
	}

	const groupedByDate = new Map<string, PricingSelectedSlot[]>();
	selectedSlots.forEach((slot) => {
		const existing = groupedByDate.get(slot.date) || [];
		existing.push(slot);
		groupedByDate.set(slot.date, existing);
	});

	const resolvedHolidayByDate = holidayByDate ?? new Map<string, HolidaySurchargeInfo>();

	const dailyBreakdown = Array.from(groupedByDate.entries())
		.sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
		.map(([date, daySlots]) =>
			buildDailyBreakdown({
				date,
				daySlots,
				comboDiscounts,
				holidayInfo: resolvedHolidayByDate.get(date),
				dayPrograms: activePrograms,
				roomId,
				roomType,
			}),
		);

	const basePrice = dailyBreakdown.reduce((sum, day) => sum + day.basePrice, 0);
	const holidaySurchargeAmount = dailyBreakdown.reduce((sum, day) => sum + day.holidaySurchargeAmount, 0);
	const programDiscountAmount = dailyBreakdown.reduce((sum, day) => sum + day.programDiscountAmount, 0);
	const comboPercentAmount = dailyBreakdown.reduce((sum, day) => sum + day.comboPercentAmount, 0);
	const comboFlatDiscount = dailyBreakdown.reduce((sum, day) => sum + day.comboFlatDiscount, 0);
	const comboDiscountAmount = dailyBreakdown.reduce((sum, day) => sum + day.comboDiscountAmount, 0);
	const totalAmount = dailyBreakdown.reduce((sum, day) => sum + day.dailyTotal, 0);
	const savings = programDiscountAmount + comboDiscountAmount;

	const firstProgramDay = dailyBreakdown.find((day) => day.appliedProgram);
	const comboDays = dailyBreakdown.filter((day) => day.comboPercent > 0 || day.comboFlatDiscount > 0);
	const firstComboDay = comboDays[0];
	
	// Show minimum combo percentage across all days (most conservative)
	const displayComboPercent = comboDays.length > 0
		? Math.min(...comboDays.map((day) => day.comboPercent))
		: 0;

	return {
		basePrice,
		holidaySurchargeAmount,
		programDiscountAmount,
		comboPercent: displayComboPercent,
		comboPercentAmount,
		comboFlatDiscount,
		comboDiscountAmount,
		totalAmount,
		savings,
		appliedProgram: firstProgramDay?.appliedProgram ?? null,
		appliedComboTier: firstComboDay?.appliedComboTier ?? null,
		dailyBreakdown,
	};
}

export function toKDisplay(amountVND: number): string {
	return `${Math.round(amountVND / 1000)}k`;
}

export function comboBadgeLabel(comboPercent: number): string | null {
	if (comboPercent <= 0) return null;
	return `Combo -${Math.round(comboPercent)}%`;
}

export function getSavingsBadgeLabel(pricing: PricingPreviewBreakdown): string | null {
	const hasProgram = pricing.programDiscountAmount > 0;
	const hasCombo = pricing.comboDiscountAmount > 0;
	const activeDiscountCount = [hasProgram, hasCombo].filter(Boolean).length;

	if (activeDiscountCount === 0) return null;
	if (activeDiscountCount > 1) return `Nhiều ưu đãi - Tiết kiệm ${toKDisplay(pricing.savings)}`;
	if (hasProgram && pricing.appliedProgram) return pricing.appliedProgram.program.name;
	if (hasCombo) return comboBadgeLabel(pricing.comboPercent) ?? "Giảm giá combo";
	return null;
}

export function getComboNotification(slotCount: number, comboPercent: number): string | null {
	if (slotCount < 2 || comboPercent <= 0) return null;
	return `Đặt ${slotCount} khung giờ liên tiếp - Giảm ${Math.round(comboPercent)}%`;
}


import type {
	ActiveDiscountProgram,
	AppliedProgramDiscount,
	ComboDiscountTier,
	HolidaySurchargeInfo,
	PricingDailyBreakdown,
	PricingPreviewBreakdown,
	PricingSelectedSlot,
} from "@/types/pricing";

export interface CalculatePricingParams {
	selectedSlots: PricingSelectedSlot[];
	comboDiscounts: ComboDiscountTier[];
	activePrograms: ActiveDiscountProgram[];
	holidayByDate?: Map<string, HolidaySurchargeInfo>;
	roomId: string;
	roomType?: string | null;
}

export function toPercentValue(value: number): number {
	if (!Number.isFinite(value)) return 0;
	return value;
}

export function getCampaignDiscountBadge(
	discountType: string | null | undefined,
	discountValue: number | null | undefined,
): string | null {
	if (!discountType || discountValue == null || !Number.isFinite(discountValue)) return null;
	if (discountType === "PERCENTAGE") return `-${Math.round(discountValue)}%`;
	if (discountType === "FIXED_AMOUNT") return `-${toKDisplay(discountValue)}`;
	return null;
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
		case "ROOM_WEEK_DAY":
			return 6;
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
		case "ROOM_WEEK_DAY":
			if (program.targetRoomId !== roomId || program.targetWeekDay == null) return [];
			return isSameWeekdayType(date, program.targetWeekDay) ? [...daySlots] : [];
		case "ROOM":
			if (program.targetRoomId !== roomId) return [];
			return [...daySlots];
		case "ROOM_TYPE":
			if (!roomType) return [];
			if (program.targetRoomType !== roomType) return [];
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

function getSlotPricesAfterSurcharge(
	daySlots: PricingSelectedSlot[],
	surcharge: HolidaySurchargeInfo | undefined,
): Map<string, number> {
	const surchargeKeys = new Set([...daySlots]
		.sort((a, b) => b.price - a.price || a.startTime.localeCompare(b.startTime))
		.slice(0, 3)
		.map(slot => slot.key));
	return new Map(daySlots.map(slot => {
		const amount = surcharge?.isHoliday && surchargeKeys.has(slot.key)
			? surcharge.surchargeType === "FIXED_AMOUNT"
				? Math.trunc(surcharge.surchargeValue)
				: Math.round(slot.price * toPercentRate(surcharge.surchargeValue))
			: 0;
		return [slot.key, slot.price + amount];
	}));
}

export function resolveBestProgramForSlot(
	slot: PricingSelectedSlot,
	date: string,
	roomId: string,
	roomType: string | null | undefined,
	programs: ActiveDiscountProgram[],
	priceAfterSurcharge: number,
): AppliedProgramDiscount | null {
	if (!programs.length) return null;
	const candidates = programs
		.filter(program => program.status === "ACTIVE" && !program.isDeleted)
		.filter(program => date >= program.startDate && date <= program.endDate)
		.filter(program => getMatchedSlots(program, [slot], date, roomId, roomType).length > 0)
		.map(program => ({
			program,
			discountAmount: program.discountType === "PERCENTAGE"
				? Math.round(priceAfterSurcharge * toPercentRate(program.discountValue))
				: Math.trunc(program.discountValue),
		}));
	candidates.sort((a, b) =>
		getProgramPriority(b.program.type) - getProgramPriority(a.program.type)
		|| b.discountAmount - a.discountAmount
		|| a.program.createdAt.localeCompare(b.program.createdAt));
	const winner = candidates[0];
	return winner ? {
		program: winner.program,
		discountAmount: Math.min(priceAfterSurcharge, winner.discountAmount),
	} : null;
}

function resolveComboTier(slotCount: number, tiers: ComboDiscountTier[]): ComboDiscountTier | null {
	if (slotCount <= 0 || !tiers.length) return null;
	const sorted = [...tiers].sort((a, b) => b.minSlots - a.minSlots);
	return sorted.find((tier) => slotCount >= tier.minSlots) ?? null;
}

function buildDailyBreakdown({
	date,
	daySlots,
	holidayInfo,
	dayPrograms,
	roomId,
	roomType,
}: {
	date: string;
	daySlots: PricingSelectedSlot[];
	holidayInfo: HolidaySurchargeInfo | undefined;
	dayPrograms: ActiveDiscountProgram[];
	roomId: string;
	roomType?: string | null;
}): PricingDailyBreakdown {
	const basePrice = sumPrices(daySlots);

	const slotPrices = getSlotPricesAfterSurcharge(daySlots, holidayInfo);
	const priceAfterSurcharge = [...slotPrices.values()].reduce((sum, price) => sum + price, 0);
	const programsById = new Map<string, AppliedProgramDiscount>();
	for (const slot of daySlots) {
		const applied = resolveBestProgramForSlot(
			slot, date, roomId, roomType, dayPrograms, slotPrices.get(slot.key) ?? slot.price,
		);
		if (applied) {
			const existing = programsById.get(applied.program.id);
			programsById.set(applied.program.id, {
				program: applied.program,
				discountAmount: (existing?.discountAmount ?? 0) + applied.discountAmount,
			});
		}
	}
	const appliedPrograms = [...programsById.values()];
	const appliedProgram = appliedPrograms.length === 1 ? appliedPrograms[0] ?? null : null;
	const programDiscountAmount = appliedPrograms.reduce((sum, applied) => sum + applied.discountAmount, 0);
	const priceAfterDiscount = priceAfterSurcharge - programDiscountAmount;

	return {
		date,
		basePrice,
		isHoliday: holidayInfo?.isHoliday ?? false,
		holidayName: holidayInfo?.holidayName ?? null,
		holidaySurchargeAmount: priceAfterSurcharge - basePrice,
		priceAfterSurcharge,
		appliedProgram,
		appliedPrograms,
		programDiscountAmount,
		priceAfterDiscount,
		slotCount: daySlots.length,
		comboPercent: 0,
		comboPercentAmount: 0,
		comboFlatDiscount: 0,
		comboDiscountAmount: 0,
		appliedComboTier: null,
		dailyTotal: priceAfterDiscount,
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
				holidayInfo: resolvedHolidayByDate.get(date),
				dayPrograms: activePrograms,
				roomId,
				roomType,
			}),
		);

	const basePrice = dailyBreakdown.reduce((sum, day) => sum + day.basePrice, 0);
	const holidaySurchargeAmount = dailyBreakdown.reduce((sum, day) => sum + day.holidaySurchargeAmount, 0);
	const programDiscountAmount = dailyBreakdown.reduce((sum, day) => sum + day.programDiscountAmount, 0);
	const totalBeforeCombo = dailyBreakdown.reduce((sum, day) => sum + day.dailyTotal, 0);

	// Combo: tính 1 lần dựa trên tổng số slot toàn booking
	const totalSlotCount = selectedSlots.length;
	const comboTier = resolveComboTier(totalSlotCount, comboDiscounts);
	const comboPercent = comboTier ? toPercentValue(comboTier.discountPercent) : 0;
	const comboFlatDiscount = comboTier?.flatDiscount ?? 0;
	const comboPercentAmount = Math.round(basePrice * toPercentRate(comboPercent));
	const comboDiscountAmount = Math.min(
		totalBeforeCombo,
		Math.max(0, comboPercentAmount + comboFlatDiscount),
	);
	const totalAmount = Math.max(0, totalBeforeCombo - comboDiscountAmount);
	const savings = programDiscountAmount + comboDiscountAmount;

	const allPrograms = dailyBreakdown.flatMap(day => day.appliedPrograms);
	const uniqueProgramIds = new Set(allPrograms.map(applied => applied.program.id));
	const firstProgram = allPrograms[0];
	const displayAppliedProgram = uniqueProgramIds.size === 1 && firstProgram
		? { program: firstProgram.program, discountAmount: programDiscountAmount }
		: null;

	return {
		basePrice,
		holidaySurchargeAmount,
		programDiscountAmount,
		comboPercent,
		comboPercentAmount,
		comboFlatDiscount,
		comboDiscountAmount,
		totalAmount,
		savings,
		appliedProgram: displayAppliedProgram,
		appliedComboTier: comboTier ?? null,
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

export function getHolidaySurchargeLabel(pricing: PricingPreviewBreakdown): string {
	const holidayNames = Array.from(
		new Set(
			pricing.dailyBreakdown
				.filter((day) => day.holidaySurchargeAmount > 0)
				.map((day) => day.holidayName?.trim())
				.filter((name): name is string => Boolean(name)),
		),
	);

	return holidayNames.length > 0
		? `Phụ thu ${holidayNames.join(', ')}`
		: 'Phụ thu ngày lễ';
}

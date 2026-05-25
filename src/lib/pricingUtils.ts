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

export function toPercentValue(value: number): number {
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

/**
 * Tính phụ thu ngày lễ theo từng slot (cộng dồn).
 * Nếu trong ngày có đúng 4 slot → chỉ tính phụ thu cho 3 slot có giá cao nhất.
 * Với loại FIXED_AMOUNT → mỗi slot được cộng thêm một khoản cố định như nhau.
 */
function applyHolidaySurchargePerSlot(
	daySlots: PricingSelectedSlot[],
	surcharge: HolidaySurchargeInfo | undefined,
): { holidaySurchargeAmount: number; priceAfterSurcharge: number; isHoliday: boolean; holidayName: string | null } {
	const basePrice = daySlots.reduce((sum, s) => sum + s.price, 0);

	if (!surcharge?.isHoliday || surcharge.surchargeValue <= 0) {
		return {
			holidaySurchargeAmount: 0,
			priceAfterSurcharge: basePrice,
			isHoliday: false,
			holidayName: surcharge?.holidayName ?? null,
		};
	}

	// Xác định những slot nào sẽ được tính phụ thu
	// Nếu có đúng 4 slot trong ngày → chỉ lấy 3 slot có giá cao nhất
	const FULL_DAY_SLOTS = 4;
	const MAX_SURCHARGE_SLOTS = 3;
	let slotsForSurcharge: PricingSelectedSlot[];
	if (daySlots.length >= FULL_DAY_SLOTS) {
		slotsForSurcharge = [...daySlots]
			.sort((a, b) => b.price - a.price)
			.slice(0, MAX_SURCHARGE_SLOTS);
	} else {
		slotsForSurcharge = [...daySlots];
	}

	const surchargeType = (surcharge.surchargeType || "PERCENTAGE") as SurchargeType;
	let holidaySurchargeAmount = 0;

	if (surchargeType === "PERCENTAGE") {
		// Cộng dồn phụ thu từng slot trong danh sách được áp dụng
		holidaySurchargeAmount = slotsForSurcharge.reduce((sum, slot) => {
			return sum + Math.round(slot.price * toPercentRate(surcharge.surchargeValue));
		}, 0);
	} else {
		// FIXED_AMOUNT: mỗi slot áp dụng đúng 1 lần khoản cố định
		holidaySurchargeAmount = Math.max(0, Math.round(surcharge.surchargeValue * slotsForSurcharge.length));
	}

	return {
		holidaySurchargeAmount,
		priceAfterSurcharge: basePrice + holidaySurchargeAmount,
		isHoliday: true,
		holidayName: surcharge.holidayName ?? null,
	};
}

export function resolveBestProgramForDate(
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

	// Tính phụ thu ngày lễ per-slot (và giới hạn 3 slot nếu chọn đủ 4 slot)
	const holidayStep = applyHolidaySurchargePerSlot(daySlots, holidayInfo);
	const priceAfterSurcharge = holidayStep.priceAfterSurcharge;

	// holidayRate dùng để tính discount program dựa theo giá sau phụ thu
	const holidayRate = basePrice > 0 ? holidayStep.holidaySurchargeAmount / basePrice : 0;

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

	// Combo is calculated at booking level (total slots), not per-day
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

	const firstProgramDay = dailyBreakdown.find((day) => day.appliedProgram);

	// Nếu nhiều ngày áp dụng các program khác nhau → không hiển thị tên cụ thể
	const uniqueProgramIds = new Set(
		dailyBreakdown
			.map((day) => day.appliedProgram?.program.id)
			.filter(Boolean)
	);
	const displayAppliedProgram = uniqueProgramIds.size <= 1
		? (firstProgramDay?.appliedProgram ?? null)
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

import type { ApiResponse } from ".";

export type DiscountProgramType =
	| "WEEKDAY_SLOT"
	| "ROOM_WEEK_DAY"
	| "ALL"
	| "ROOM"
	| "ROOM_TYPE"
	| "SLOT_TYPE"
	| "WEEK_DAY";
export type DiscountValueType = "PERCENTAGE" | "FIXED_AMOUNT";
export type SurchargeType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface ComboDiscountApiItem {
	id: string;
	isDeleted: boolean;
	createdAt: string;
	updatedAt: string;
	minSlots: number;
	percentageDiscount: number;
	flatDiscount: number;
	isActive: boolean;
}

export interface ComboDiscountTier {
	minSlots: number;
	discountPercent: number;
	flatDiscount: number;
}

// One combo cycle of a booking: a full cycle of the largest tier, or the leftover slots.
export interface ComboCycleDiscount {
	slotCount: number;
	baseAmount: number;
	tier: ComboDiscountTier | null;
	percent: number;
	percentAmount: number;
	flatDiscount: number;
	discountAmount: number;
}

export interface ActiveDiscountProgram {
	id: string;
	isDeleted: boolean;
	createdAt: string;
	updatedAt: string;
	name: string;
	type: DiscountProgramType;
	discountType: DiscountValueType;
	discountValue: number;
	startDate: string;
	endDate: string;
	status: "ACTIVE" | "INACTIVE" | "EXPIRED";
	targetWeekDay: boolean | null;
	targetOvernightSlot: boolean | null;
	targetRoomType: string | null;
	targetRoomId: string | null;
	targetRoomName: string | null;
	// WEEKDAY_SLOT only: ISO weekdays (1 = Monday ... 7 = Sunday); no rooms means every room
	targetWeekDays?: number[] | null;
	targetRoomIds?: string[] | null;
	targetRoomNames?: string[] | null;
}

export interface HolidaySurchargeInfo {
	isHoliday: boolean;
	holidayName: string | null;
	surchargeValue: number;
	surchargeType: SurchargeType;
}

export interface PricingSelectedSlot {
	key: string;
	roomId: string;
	date: string;
	slotId: string;
	startTime: string;
	endTime: string;
	price: number;
	isOvernight: boolean;
}

export interface AppliedProgramDiscount {
	program: ActiveDiscountProgram;
	discountAmount: number;
}

export interface PricingDailyBreakdown {
	appliedPrograms: AppliedProgramDiscount[];
	date: string;
	basePrice: number;
	isHoliday: boolean;
	holidayName: string | null;
	holidaySurchargeAmount: number;
	priceAfterSurcharge: number;
	appliedProgram: AppliedProgramDiscount | null;
	programDiscountAmount: number;
	priceAfterDiscount: number;
	slotCount: number;
	comboPercent: number;
	comboPercentAmount: number;
	comboFlatDiscount: number;
	comboDiscountAmount: number;
	appliedComboTier: ComboDiscountTier | null;
	dailyTotal: number;
}

export interface PricingPreviewBreakdown {
	basePrice: number;
	holidaySurchargeAmount: number;
	programDiscountAmount: number;
	comboCycles: ComboCycleDiscount[];
	comboDiscountAmount: number;
	totalAmount: number;
	savings: number;
	appliedProgram: AppliedProgramDiscount | null;
	dailyBreakdown: PricingDailyBreakdown[];
}

export type ComboDiscountsApiResponse = ApiResponse<ComboDiscountApiItem[]>;
export type ActiveDiscountProgramsApiResponse = ApiResponse<
	ActiveDiscountProgram[]
>;
export type HolidaySurchargeApiResponse = ApiResponse<HolidaySurchargeInfo>;

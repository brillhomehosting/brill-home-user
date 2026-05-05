import type { ApiResponse } from ".";

export type DiscountProgramType = "ALL" | "ROOM" | "ROOM_TYPE" | "SLOT_TYPE" | "WEEK_DAY";
export type DiscountValueType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface ComboDiscountTier {
	minSlots: number;
	discountPercent: number;
	flatDiscount: number;
}

export interface ActiveDiscountProgram {
	id: string;
	name: string;
	type: DiscountProgramType;
	discountType: DiscountValueType;
	discountValue: number;
	startDate: string;
	endDate: string;
	status: "ACTIVE" | "INACTIVE" | "EXPIRED";
	targetRoomType: string | null;
	targetRoomId: string | null;
	targetOvernightSlot: boolean | null;
	targetWeekDaySlot: boolean | null;
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

export interface PricingPreviewBreakdown {
	basePrice: number;
	programDiscountAmount: number;
	comboPercent: number;
	comboPercentAmount: number;
	comboFlatDiscount: number;
	comboDiscountAmount: number;
	totalAmount: number;
	savings: number;
	appliedProgram: AppliedProgramDiscount | null;
	appliedComboTier: ComboDiscountTier | null;
}

export type ComboDiscountsApiResponse = ApiResponse<ComboDiscountTier[]>;
export type ActiveDiscountProgramsApiResponse = ApiResponse<ActiveDiscountProgram[]>;

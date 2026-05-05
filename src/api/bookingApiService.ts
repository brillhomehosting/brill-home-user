import type {
	ActiveDiscountProgramsApiResponse,
	ComboDiscountsApiResponse,
	HolidaySurchargeApiResponse,
} from "@/types/pricing";
import type { AvailabilityApiResponse } from "@/types/timeslot";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface FetchAvailabilityParams {
	startDate: string;
	endDate: string;
	roomId?: string;
}

export interface FetchHolidaySurchargeParams {
	date: string;
}

export const bookingApi = {
	/**
	 * Fetch availability for all rooms or a specific room.
	 * GET /api/v1/bookings/availability?startDate=...&endDate=...&roomId=...
	 */
	fetchAvailability: async (
		params: FetchAvailabilityParams,
	): Promise<AvailabilityApiResponse> => {
		const searchParams = new URLSearchParams({
			startDate: params.startDate,
			endDate: params.endDate,
		});
		if (params.roomId) {
			searchParams.set("roomId", params.roomId);
		}
		const response = await fetch(
			`${API_BASE_URL}/api/v1/bookings/availability?${searchParams.toString()}`,
		);
		return response.json();
	},
	fetchComboDiscounts: async (): Promise<ComboDiscountsApiResponse> => {
		const response = await fetch(`${API_BASE_URL}/api/v1/combo-configs`);
		return response.json();
	},
	fetchActiveDiscountCampaigns:
		async (): Promise<ActiveDiscountProgramsApiResponse> => {
			const response = await fetch(
				`${API_BASE_URL}/api/v1/discount-campaigns/active`,
			);
			return response.json();
		},
	fetchHolidaySurcharge: async (
		params: FetchHolidaySurchargeParams,
	): Promise<HolidaySurchargeApiResponse> => {
		const searchParams = new URLSearchParams({ date: params.date });
		const legacyUrl = `${API_BASE_URL}/api/v1/holiday-surcharges/check-date?${searchParams.toString()}`;
		try {
			const legacyResponse = await fetch(legacyUrl);
			const legacyPayload = await legacyResponse.json();
			if (legacyPayload?.success) {
				return legacyPayload;
			}
		} catch {
			// Fallback to the newer endpoint format below.
		}

		const fallbackResponse = await fetch(
			`${API_BASE_URL}/api/v1/holidays/surcharge?${searchParams.toString()}`,
		);
		return fallbackResponse.json();
	},
};

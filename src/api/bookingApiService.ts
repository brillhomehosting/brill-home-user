import type { AvailabilityApiResponse } from "@/types/timeslot";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface FetchAvailabilityParams {
	startDate: string;
	endDate: string;
	roomId?: string;
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
};

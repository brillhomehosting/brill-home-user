import type {
	RoomApiResponse,
	RoomsApiResponse,
	RoomTimeSlotsApiResponse,
	TimeSlotAvailabilityApiResponse,
} from "@/types/room";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const roomsApi = {
	fetchRooms: async (): Promise<RoomsApiResponse> => {
		console.log(API_BASE_URL);
		const response = await fetch(`${API_BASE_URL}/api/v1/rooms`);
		return response.json();
	},
	fetchRoomById: async (id: string): Promise<RoomApiResponse> => {
		const response = await fetch(`${API_BASE_URL}/api/v1/rooms/${id}`);
		return response.json();
	},
	fetchRoomTimeSlots: async (
		roomId: string,
	): Promise<RoomTimeSlotsApiResponse> => {
		const response = await fetch(
			`${API_BASE_URL}/api/v1/rooms/${roomId}/time-slots`,
		);
		return response.json();
	},
	fetchTimeSlotAvailability: async (
		roomId: string,
		startDate: string,
		endDate: string,
	): Promise<TimeSlotAvailabilityApiResponse> => {
		const response = await fetch(
			`${API_BASE_URL}/api/v1/rooms/${roomId}/time-slots/availability?startDate=${startDate}&endDate=${endDate}`,
		);
		return response.json();
	},
};

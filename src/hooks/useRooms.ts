import { roomsApi } from "@/api/roomApiService";
import { useQuery } from "@tanstack/react-query";

export function useRooms() {
	return useQuery({
		queryKey: ["rooms"],
		queryFn: async () => {
			const response = await roomsApi.fetchRooms();
			if (!response.success) {
				throw new Error(response.message || "Failed to fetch rooms");
			}
			return response.data;
		},
		select: (data) => data.content,
	});
}

// Hook to get rooms with pagination info
export function useRoomsPaginated() {
	return useQuery({
		queryKey: ["rooms", "paginated"],
		queryFn: async () => {
			const response = await roomsApi.fetchRooms();
			if (!response.success) {
				throw new Error(response.message || "Failed to fetch rooms");
			}
			return response.data;
		},
	});
}

// Hook to get time slot availability for a specific room
export function useTimeSlotAvailability(
	roomId: string | undefined,
	startDate: string,
	endDate: string,
) {
	return useQuery({
		queryKey: ["timeSlotAvailability", roomId, startDate, endDate],
		queryFn: async () => {
			if (!roomId) {
				throw new Error("Room ID is required");
			}
			const response = await roomsApi.fetchTimeSlotAvailability(
				roomId,
				startDate,
				endDate,
			);
			if (!response.success) {
				throw new Error(
					response.message ||
						"Failed to fetch time slot availability",
				);
			}
			return response.data;
		},
		enabled: !!roomId && !!startDate && !!endDate,
	});
}

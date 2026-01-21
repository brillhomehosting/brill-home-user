import { roomsApi } from "@/api/roomApiService";
import { useQuery } from "@tanstack/react-query";

export function useTimeSlotAvailability(
	roomId: string | undefined,
	startDate: string,
	endDate: string,
) {
	return useQuery({
		queryKey: ["timeSlotAvailability", roomId, startDate, endDate],
		queryFn: async () => {
			if (!roomId) throw new Error("Room ID is required");
			const response = await roomsApi.fetchTimeSlotAvailability(
				roomId,
				startDate,
				endDate,
			);
			if (!response.success) {
				throw new Error(
					response.message || "Failed to fetch availability",
				);
			}
			return response.data;
		},
		enabled: !!roomId && !!startDate && !!endDate,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
}

import { roomsApi } from "@/api/roomApiService";
import { useQuery } from "@tanstack/react-query";

export function useRoomTimeSlots(roomId: string | undefined) {
	return useQuery({
		queryKey: ["roomTimeSlots", roomId],
		queryFn: async () => {
			if (!roomId) throw new Error("Room ID is required");
			const response = await roomsApi.fetchRoomTimeSlots(roomId);
			if (!response.success) {
				throw new Error(
					response.message || "Failed to fetch timeslots",
				);
			}
			return response.data;
		},
		enabled: !!roomId,
		staleTime: 1000 * 60 * 5, // 5 minutes - will refetch if stale
	});
}

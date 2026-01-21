import { roomsApi } from "@/api/roomApiService";
import { useQuery } from "@tanstack/react-query";

export function useRoom(id: string | undefined) {
	return useQuery({
		queryKey: ["room", id],
		queryFn: async () => {
			if (!id) throw new Error("Room ID is required");
			const response = await roomsApi.fetchRoomById(id);
			if (!response.success) {
				throw new Error(response.message || "Failed to fetch room");
			}
			return response.data;
		},
		enabled: !!id, // Only fetch when id is available
	});
}

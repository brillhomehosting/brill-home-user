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


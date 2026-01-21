import { roomsApi } from "@/api/roomApiService";
import { Room, TimeSlot } from "@/types/room";
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

export function useRoomsTimeSlots(rooms: Room[] | undefined) {
	const queries = useQueries({
		queries: (rooms || []).map((room) => ({
			queryKey: ["roomTimeSlots", room.id],
			queryFn: async () => {
				const response = await roomsApi.fetchRoomTimeSlots(room.id);
				if (!response.success) {
					throw new Error(
						response.message || "Failed to fetch timeslots",
					);
				}
				// Return just the array to be compatible with useRoomTimeSlots
				return response.data;
			},
			enabled: !!room.id,
			staleTime: 1000 * 60 * 5, // 5 minutes - will refetch if stale
		})),
	});

	const timeSlotsMap = useMemo(() => {
		const map = new Map<string, TimeSlot[]>();
		(rooms || []).forEach((room, index) => {
			const query = queries[index];
			if (query?.data) {
				map.set(room.id, query.data);
			}
		});
		return map;
	}, [queries, rooms]);

	const isLoading = queries.some((q) => q.isLoading);

	return { data: timeSlotsMap, isLoading, queries };
}

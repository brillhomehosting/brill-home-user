import { roomsApi } from "@/api/roomApiService";
import { DayAvailability, Room } from "@/types/room";
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

export function useRoomsAvailability(
	rooms: Room[] | undefined,
	startDate: string,
	endDate: string,
) {
	const queries = useQueries({
		queries: (rooms || []).map((room) => ({
			queryKey: ["timeSlotAvailability", room.id, startDate, endDate],
			queryFn: async () => {
				const response = await roomsApi.fetchTimeSlotAvailability(
					room.id,
					startDate,
					endDate,
				);
				if (!response.success) {
					throw new Error(
						response.message || "Failed to fetch availability",
					);
				}
				// Return just the array to be compatible with useTimeSlotAvailability
				return response.data;
			},
			enabled: !!room.id && !!startDate && !!endDate,
			staleTime: 1000 * 60 * 5, // 5 minutes
		})),
	});

	const availabilityMap = useMemo(() => {
		const map = new Map<string, DayAvailability[]>();
		(rooms || []).forEach((room, index) => {
			const query = queries[index];
			if (query?.data && Array.isArray(query.data)) {
				map.set(room.id, query.data);
			}
		});
		return map;
	}, [queries, rooms]);

	const isLoading = queries.some((q) => q.isLoading);

	return { data: availabilityMap, isLoading, queries };
}

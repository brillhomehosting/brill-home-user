import { bookingApi } from "@/api/bookingApiService";
import { selectCachedAvailabilityRange } from "@/lib/availabilityCache";
import { useAvailabilityStore } from "@/store/availabilityStore";
import type { DayAvailability, RoomAvailability } from "@/types/timeslot";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

/**
 * Refactored hook: now uses the centralized GET /api/v1/bookings/availability
 * instead of N parallel per-room queries.
 *
 * Returns a Map<roomId, DayAvailability[]> for backward compatibility.
 */
export function useRoomsAvailability(
	startDate: string,
	endDate: string,
	options: { roomId?: string; roomIds?: string[] } = {},
) {
	const { roomId, roomIds } = options;
	const availabilityByRoom = useAvailabilityStore((s) => s.availabilityByRoom);
	const mergeAvailabilitySnapshot = useAvailabilityStore((s) => s.mergeAvailabilitySnapshot);

	const cachedRange = useMemo(
		() => selectCachedAvailabilityRange({
			availabilityByRoom,
			startDate,
			endDate,
			roomId,
			roomIds,
		}),
		[availabilityByRoom, startDate, endDate, roomId, roomIds],
	);

	const query = useQuery({
		queryKey: ["availability", startDate, endDate, roomId ?? "all"],
		queryFn: async () => {
			const params: { startDate: string; endDate: string; roomId?: string } = {
				startDate,
				endDate,
			};
			if (roomId) params.roomId = roomId;

			const response = await bookingApi.fetchAvailability(params);
			if (!response.success) {
				throw new Error(response.message || "Failed to fetch availability");
			}

			return response.data;
		},
		enabled: !!startDate && !!endDate,
		staleTime: 0,
		refetchOnMount: "always",
	});

	useEffect(() => {
		if (query.data) {
			mergeAvailabilitySnapshot(query.data);
		}
	}, [query.data, mergeAvailabilitySnapshot]);

	// Convert RoomAvailability[] to Map<roomId, DayAvailability[]> for backward compat
	const availabilityMap = useMemo(() => {
		const map = new Map<string, DayAvailability[]>();
		const sourceData = cachedRange.data.length > 0 ? cachedRange.data : query.data;
		if (!sourceData) return map;

		for (const roomAvail of sourceData) {
			map.set(roomAvail.roomId, roomAvail.timeslots);
		}
		return map;
	}, [cachedRange.data, query.data]);

	// Also provide the raw response for components that want the new shape
	const rawData: RoomAvailability[] | undefined = cachedRange.data.length > 0
		? cachedRange.data
		: query.data;
	const hasCachedData = cachedRange.data.length > 0;

	return {
		data: availabilityMap,
		rawData,
		isLoading: !hasCachedData && query.isLoading,
		isFetching: query.isFetching,
		error: hasCachedData ? null : query.error,
		refetch: query.refetch,
	};
}

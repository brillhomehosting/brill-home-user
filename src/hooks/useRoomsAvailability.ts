import { bookingApi } from "@/api/bookingApiService";
import { useAvailabilityStore } from "@/store/availabilityStore";
import type { DayAvailability, RoomAvailability } from "@/types/timeslot";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

/**
 * Refactored hook: now uses the centralized GET /api/v1/bookings/availability
 * instead of N parallel per-room queries.
 *
 * Returns a Map<roomId, DayAvailability[]> for backward compatibility.
 */
export function useRoomsAvailability(
	startDate: string,
	endDate: string,
	roomId?: string,
) {
	const setInitialData = useAvailabilityStore((s) => s.setInitialData);

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

			// Populate the Zustand store with initial snapshot
			setInitialData(response.data);
			return response.data;
		},
		enabled: !!startDate && !!endDate,
		staleTime: 1000 * 60 * 2, // 2 minutes
	});

	// Convert RoomAvailability[] to Map<roomId, DayAvailability[]> for backward compat
	const availabilityMap = useMemo(() => {
		const map = new Map<string, DayAvailability[]>();
		if (!query.data) return map;

		for (const roomAvail of query.data) {
			map.set(roomAvail.roomId, roomAvail.timeslots);
		}
		return map;
	}, [query.data]);

	// Also provide the raw response for components that want the new shape
	const rawData: RoomAvailability[] | undefined = query.data;

	return {
		data: availabilityMap,
		rawData,
		isLoading: query.isLoading,
		error: query.error,
		refetch: query.refetch,
	};
}

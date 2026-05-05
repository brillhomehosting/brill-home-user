import { bookingApi } from "@/api/bookingApiService";
import { useAvailabilityStore } from "@/store/availabilityStore";
import type { DayAvailability } from "@/types/timeslot";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

/**
 * Hook to fetch availability for a single room using the centralized API.
 * Returns DayAvailability[] for backward compatibility.
 */
export function useTimeSlotAvailability(
	roomId: string | undefined,
	startDate: string,
	endDate: string,
) {
	const setInitialData = useAvailabilityStore((s) => s.setInitialData);

	const query = useQuery({
		queryKey: ["availability", startDate, endDate, roomId ?? ""],
		queryFn: async () => {
			if (!roomId) throw new Error("Room ID is required");

			const response = await bookingApi.fetchAvailability({
				startDate,
				endDate,
				roomId,
			});
			if (!response.success) {
				throw new Error(
					response.message || "Failed to fetch time slot availability",
				);
			}

			// Populate the Zustand store
			setInitialData(response.data);
			return response.data;
		},
		enabled: !!roomId && !!startDate && !!endDate,
		staleTime: 1000 * 60 * 2,
	});

	// Extract DayAvailability[] for the specific room (backward compat)
	const dayAvailability: DayAvailability[] | undefined = useMemo(() => {
		if (!query.data || !roomId) return undefined;
		const roomData = query.data.find((r) => r.roomId === roomId);
		return roomData?.timeslots;
	}, [query.data, roomId]);

	return {
		data: dayAvailability,
		isLoading: query.isLoading,
		error: query.error,
		refetch: query.refetch,
	};
}

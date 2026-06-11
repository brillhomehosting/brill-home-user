import { bookingApi } from "@/api/bookingApiService";
import { selectCachedAvailabilityRange } from "@/lib/availabilityCache";
import { useAvailabilityStore } from "@/store/availabilityStore";
import type { DayAvailability } from "@/types/timeslot";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

/**
 * Hook to fetch availability for a single room using the centralized API.
 * Returns DayAvailability[] for backward compatibility.
 */
export function useTimeSlotAvailability(
	roomId: string | undefined,
	startDate: string,
	endDate: string,
) {
	const availabilityByRoom = useAvailabilityStore((s) => s.availabilityByRoom);
	const mergeAvailabilitySnapshot = useAvailabilityStore((s) => s.mergeAvailabilitySnapshot);

	const cachedRange = useMemo(
		() => selectCachedAvailabilityRange({
			availabilityByRoom,
			startDate,
			endDate,
			roomId,
		}),
		[availabilityByRoom, startDate, endDate, roomId],
	);

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

			return response.data;
		},
		enabled: !!roomId && !!startDate && !!endDate,
		staleTime: 0,
		refetchOnMount: "always",
	});

	useEffect(() => {
		if (query.data) {
			mergeAvailabilitySnapshot(query.data);
		}
	}, [query.data, mergeAvailabilitySnapshot]);

	// Extract DayAvailability[] for the specific room (backward compat)
	const dayAvailability: DayAvailability[] | undefined = useMemo(() => {
		const sourceData = cachedRange.data.length > 0 ? cachedRange.data : query.data;
		if (!sourceData || !roomId) return undefined;
		const roomData = sourceData.find((r) => r.roomId === roomId);
		return roomData?.timeslots;
	}, [cachedRange.data, query.data, roomId]);

	const hasCachedData = cachedRange.data.length > 0;

	return {
		data: dayAvailability,
		isLoading: !hasCachedData && query.isLoading,
		isFetching: query.isFetching,
		error: hasCachedData ? null : query.error,
		refetch: query.refetch,
	};
}

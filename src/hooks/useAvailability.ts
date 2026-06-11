import { bookingApi, type FetchAvailabilityParams } from "@/api/bookingApiService";
import { selectCachedAvailabilityRange } from "@/lib/availabilityCache";
import { useAvailabilityStore } from "@/store/availabilityStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

/**
 * Hook to fetch availability data from the centralized endpoint.
 * Populates the Zustand availability store on success.
 *
 * @param params - startDate, endDate, optional roomId
 */
export function useAvailability(params: FetchAvailabilityParams & { enabled?: boolean }) {
	const { startDate, endDate, roomId, enabled = true } = params;
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
		queryKey: ["availability", startDate, endDate, roomId ?? "all"],
		queryFn: async () => {
			const response = await bookingApi.fetchAvailability({
				startDate,
				endDate,
				roomId,
			});
			if (!response.success) {
				throw new Error(response.message || "Failed to fetch availability");
			}
			return response.data;
		},
		enabled: enabled && !!startDate && !!endDate,
		staleTime: 0,
		refetchOnMount: "always",
	});

	useEffect(() => {
		if (query.data) {
			mergeAvailabilitySnapshot(query.data);
		}
	}, [query.data, mergeAvailabilitySnapshot]);

	return {
		...query,
		data: cachedRange.data.length > 0 ? cachedRange.data : query.data,
		isLoading: cachedRange.data.length > 0 ? false : query.isLoading,
		error: cachedRange.data.length > 0 ? null : query.error,
	};
}

import { bookingApi, type FetchAvailabilityParams } from "@/api/bookingApiService";
import { useAvailabilityStore } from "@/store/availabilityStore";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook to fetch availability data from the centralized endpoint.
 * Populates the Zustand availability store on success.
 *
 * @param params - startDate, endDate, optional roomId
 */
export function useAvailability(params: FetchAvailabilityParams & { enabled?: boolean }) {
	const { startDate, endDate, roomId, enabled = true } = params;
	const setInitialData = useAvailabilityStore((s) => s.setInitialData);

	return useQuery({
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
			// Populate the Zustand store with initial snapshot
			setInitialData(response.data);
			return response.data;
		},
		enabled: enabled && !!startDate && !!endDate,
		staleTime: 1000 * 60 * 2, // 2 minutes — SSE handles delta updates
	});
}

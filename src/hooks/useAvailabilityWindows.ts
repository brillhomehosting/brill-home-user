import { bookingApi } from "@/api/bookingApiService";
import { selectCachedAvailabilityRange } from "@/lib/availabilityCache";
import { buildBookingDateKeys, splitIntoWindows, toDateKey, type AvailabilityWindow } from "@/lib/bookingDates";
import { useAvailabilityStore } from "@/store/availabilityStore";
import { useQueries, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";

const queryKeyFor = (window: AvailabilityWindow, roomId?: string) =>
	["availability", window.startDate, window.endDate, roomId ?? "all"] as const;

/**
 * Loads the booking calendar window by window. Days live in the availability
 * store; each query only caches how many rows it delivered, so the query cache
 * does not hold a second copy of the payload.
 */
export function useAvailabilityWindows({
	roomId,
	roomIds,
	maxAdvanceDays,
}: {
	roomId?: string;
	roomIds?: string[];
	maxAdvanceDays: number;
}) {
	const queryClient = useQueryClient();
	const mergeAvailabilitySnapshot = useAvailabilityStore((s) => s.mergeAvailabilitySnapshot);

	// The date list is fixed per mount. Recomputing it at midnight would shift
	// every window and refetch all of them at once.
	const [openedAt] = useState(() => new Date());
	const dateKeys = useMemo(() => buildBookingDateKeys(openedAt, maxAdvanceDays), [openedAt, maxAdvanceDays]);
	const windows = useMemo(() => splitIntoWindows(dateKeys), [dateKeys]);
	const [requestedCount, setRequestedCount] = useState(1);
	const activeWindows = useMemo(() => windows.slice(0, requestedCount), [windows, requestedCount]);

	const queries = useMemo(
		() => activeWindows.map((window) => ({
			queryKey: queryKeyFor(window, roomId),
			queryFn: async ({ signal }: { signal: AbortSignal }) => {
				const response = await bookingApi.fetchAvailability(
					{ startDate: window.startDate, endDate: window.endDate, roomId },
					signal,
				);
				if (!response.success) {
					throw new Error(response.message || "Failed to fetch availability");
				}
				mergeAvailabilitySnapshot(response.data);
				return window.rowCount;
			},
			// Days already in the store (e.g. coming from the landing page) show immediately.
			placeholderData: () => {
				if (!roomId && !roomIds?.length) return undefined;
				const { isComplete } = selectCachedAvailabilityRange({
					availabilityByRoom: useAvailabilityStore.getState().availabilityByRoom,
					startDate: window.startDate,
					endDate: window.endDate,
					roomId,
					roomIds,
				});
				return isComplete ? window.rowCount : undefined;
			},
			staleTime: 0,
			refetchOnMount: "always" as const,
		})),
		[activeWindows, roomId, roomIds, mergeAvailabilitySnapshot],
	);

	const combine = useCallback((results: UseQueryResult<number>[]) => {
		let loadedRowCount = 0;
		for (const result of results) {
			if (result.data === undefined) break;
			loadedRowCount += result.data;
		}
		return {
			loadedRowCount,
			isFetching: results.some((result) => result.isFetching),
			failedIndex: results.findIndex((result) => result.isError && result.data === undefined),
		};
	}, []);

	const { loadedRowCount, isFetching, failedIndex } = useQueries({ queries, combine });

	const isFetchingRef = useRef(isFetching);
	isFetchingRef.current = isFetching;
	const loadMore = useCallback(() => {
		if (isFetchingRef.current) return;
		setRequestedCount((count) => Math.min(count + 1, windows.length));
	}, [windows.length]);

	const retryFailed = useCallback(() => {
		const failed = activeWindows[failedIndex];
		if (failed) {
			void queryClient.refetchQueries({ queryKey: queryKeyFor(failed, roomId) });
		}
	}, [activeWindows, failedIndex, queryClient, roomId]);

	const loadedDateKeys = useMemo(() => dateKeys.slice(0, loadedRowCount), [dateKeys, loadedRowCount]);

	return {
		todayKey: toDateKey(new Date()),
		loadedDateKeys,
		lastDateKey: dateKeys[dateKeys.length - 1],
		isLoadingFirst: loadedRowCount === 0 && failedIndex < 0,
		isFetching,
		hasMore: loadedRowCount < dateKeys.length,
		hasFailed: failedIndex >= 0,
		loadMore,
		retryFailed,
	};
}

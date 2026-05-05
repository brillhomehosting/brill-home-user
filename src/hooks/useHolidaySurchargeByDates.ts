import { bookingApi } from "@/api/bookingApiService";
import type { HolidaySurchargeInfo } from "@/types/pricing";
import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

const DEFAULT_SURCHARGE: HolidaySurchargeInfo = {
	isHoliday: false,
	holidayName: null,
	surchargeValue: 0,
	surchargeType: "PERCENTAGE",
};

export function useHolidaySurchargeByDates(dates: string[]) {
	const uniqueDates = useMemo(() => Array.from(new Set(dates)).sort(), [dates]);

	const queries = useQueries({
		queries: uniqueDates.map((date) => ({
			queryKey: ["holidaySurcharge", date],
			queryFn: async (): Promise<HolidaySurchargeInfo> => {
				const response = await bookingApi.fetchHolidaySurcharge({ date });
				if (!response.success) {
					throw new Error(
						response.message || "Failed to fetch holiday surcharge",
					);
				}
				const data = response.data as any;
				if (!data) return DEFAULT_SURCHARGE;

				return {
					isHoliday: Boolean(data.holiday),
					holidayName: data.effectiveHolidayName || data.holidayName || null,
					surchargeType: data.surchargeType === "AMOUNT" ? "FIXED_AMOUNT" : "PERCENTAGE",
					surchargeValue: data.surchargeType === "AMOUNT" 
						? (data.surchargeAmount ?? 0) 
						: (data.surchargePercent ?? data.surchargeValue ?? 0),
				};
			},
			enabled: Boolean(date),
			staleTime: 1000 * 60 * 5,
			refetchOnWindowFocus: false,
			refetchOnReconnect: false,
		})),
	});

	const data = useMemo(() => {
		const map = new Map<string, HolidaySurchargeInfo>();
		uniqueDates.forEach((date, idx) => {
			map.set(date, queries[idx]?.data || DEFAULT_SURCHARGE);
		});
		return map;
	}, [uniqueDates, queries]);

	return {
		data,
		isLoading: queries.some((query) => query.isLoading),
	};
}

import { bookingApi } from "@/api/bookingApiService";
import type { ActiveDiscountProgram } from "@/types/pricing";
import { useQuery } from "@tanstack/react-query";

export function useActiveDiscountPrograms(roomId?: string | null, date?: string | null) {
	return useQuery({
		queryKey: ["activeDiscountPrograms", roomId ?? "", date ?? ""],
		queryFn: async (): Promise<ActiveDiscountProgram[]> => {
			const response = await bookingApi.fetchActiveDiscountPrograms({
				roomId: roomId || undefined,
				date: date || undefined,
			});
			if (!response.success) {
				throw new Error(response.message || "Failed to fetch active discount programs");
			}
			return response.data || [];
		},
		enabled: !!roomId && !!date,
		staleTime: 1000 * 60,
	});
}

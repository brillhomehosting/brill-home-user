import { bookingApi } from "@/api/bookingApiService";
import type { ActiveDiscountProgram } from "@/types/pricing";
import { useQuery } from "@tanstack/react-query";

export function useActiveDiscountCampaigns() {
	return useQuery({
		queryKey: ["activeDiscountCampaigns"],
		queryFn: async (): Promise<ActiveDiscountProgram[]> => {
			const response = await bookingApi.fetchActiveDiscountCampaigns();
			if (!response.success) {
				throw new Error(
					response.message || "Failed to fetch active discount campaigns",
				);
			}

			return (response.data || []).filter(
				(program) => program.status === "ACTIVE" && !program.isDeleted,
			);
		},
		staleTime: 1000 * 60 * 5,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});
}

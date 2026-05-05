import { bookingApi } from "@/api/bookingApiService";
import type { ComboDiscountApiItem, ComboDiscountTier } from "@/types/pricing";
import { useQuery } from "@tanstack/react-query";

function toPercentValue(value: number): number {
	if (!Number.isFinite(value)) return 0;
	return value <= 1 ? value * 100 : value;
}

export function useComboDiscounts() {
	return useQuery({
		queryKey: ["comboDiscounts"],
		queryFn: async (): Promise<ComboDiscountTier[]> => {
			const response = await bookingApi.fetchComboDiscounts();
			if (!response.success) {
				throw new Error(
					response.message || "Failed to fetch combo discounts",
				);
			}

			return (response.data || [])
				.filter(
					(tier: ComboDiscountApiItem) =>
						tier.isActive && !tier.isDeleted,
				)
				.map((tier: ComboDiscountApiItem) => ({
					minSlots: tier.minSlots,
					discountPercent: toPercentValue(tier.percentageDiscount),
					flatDiscount: tier.flatDiscount ?? 0,
				}))
				.filter((tier) => tier.minSlots > 0)
				.sort((a, b) => b.minSlots - a.minSlots);
		},
		staleTime: 1000 * 60 * 5,
		refetchOnWindowFocus: false,
	});
}

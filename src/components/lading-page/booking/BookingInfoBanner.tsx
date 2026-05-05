import { toKDisplay } from '@/lib/pricingUtils';
import type { ComboDiscountTier } from '@/types/pricing';

interface BookingInfoBannerProps {
	comboDiscounts: ComboDiscountTier[];
	isLoading: boolean;
}

function toPercentValue(value: number): number {
	return value <= 1 ? value * 100 : value;
}

export default function BookingInfoBanner({ comboDiscounts, isLoading }: BookingInfoBannerProps) {
	if (isLoading) {
		return (
			<div className="mt-2 py-1.5 px-3 bg-white border border-stone-200 rounded-lg text-[10px] text-stone-500 text-center">
				Đang tải ưu đãi combo...
			</div>
		);
	}

	const sortedTiers = [...comboDiscounts].sort((a, b) => a.minSlots - b.minSlots);
	if (sortedTiers.length === 0) {
		return (
			<div className="mt-2 py-1.5 px-3 bg-white border border-stone-200 rounded-lg text-[10px] text-stone-500 text-center">
				Chưa có ưu đãi combo.
			</div>
		);
	}

	return (
		<div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 py-1.5 px-3 bg-white border border-stone-200 rounded-lg text-[10px] text-stone-500">
			<span>Ưu đãi combo:</span>
			{sortedTiers.map((tier, index) => (
				<span key={`${tier.minSlots}-${index}`} className="text-green-600 font-semibold">
					{tier.minSlots} khung → -{Math.round(toPercentValue(tier.discountPercent))}%
					{tier.flatDiscount > 0 ? ` và -${toKDisplay(tier.flatDiscount)}` : ''}
				</span>
			))}
		</div>
	);
}

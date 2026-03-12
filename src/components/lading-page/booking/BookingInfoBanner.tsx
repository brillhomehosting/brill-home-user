import { DISCOUNT_PROGRAM_PERCENT } from '@/constants/pricing';

interface BookingInfoBannerProps {
	showDiscountBanner: boolean;
}

export default function BookingInfoBanner({ showDiscountBanner }: BookingInfoBannerProps) {
	return (
		<div className="mt-2 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white border border-stone-200 rounded-lg text-[10px] text-stone-500">
			{showDiscountBanner ? (
				<>
					<span className="text-green-700 font-semibold">
						🎁 Khuyến mãi: Giảm {Math.round(DISCOUNT_PROGRAM_PERCENT * 100)}% tất cả đặt phòng từ 2/3 - 5/3/2026
					</span>
					<span>·</span>
					<span className="text-green-600 font-semibold">Thứ 2 - Thứ 6: -20k/đơn</span>
				</>
			) : (
				<>
					<span>Ưu đãi combo:</span>
					<span className="text-green-600 font-semibold">2 khung → -5%</span>
					<span>·</span>
					<span className="text-green-600 font-semibold">3 khung → -10%</span>
					<span>·</span>
					<span className="text-green-600 font-semibold">4+ khung → -20%</span>
					<span>·</span>
					<span className="text-green-600 font-semibold">Thứ 2 - Thứ 6 → -20k/đơn</span>
				</>
			)}
		</div>
	);
}

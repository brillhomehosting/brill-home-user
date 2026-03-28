'use client';

import messengerIcon from '@/assets/icon-messenger.png';
import { getSavingsBadgeLabel, PricingBreakdown, toKDisplay } from '@/lib/pricingUtils';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Image from 'next/image';

interface MobileBookingBarProps {
	selectedSlots: Set<string>;
	pricing: PricingBreakdown;
	isCopied: boolean;
	onBookNow: () => void;
}

export default function MobileBookingBar({
	selectedSlots,
	pricing,
	isCopied,
	onBookNow,
}: MobileBookingBarProps) {
	if (selectedSlots.size === 0) return null;

	const savingsBadgeLabel = getSavingsBadgeLabel(pricing);

	return (
		<motion.div
			initial={{ opacity: 0, y: 24 }}
			animate={{ opacity: 1, y: 0 }}
			className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white border-t border-stone-200 shadow-[0_-4px_24px_rgba(0,0,0,0.10)]"
		>
			<div className="px-4 pt-3 pb-1">
				{/* Row 1: slot count + badge */}
				<div className="flex items-center justify-between mb-2">
					<span className="text-xs text-stone-500">
						Đã chọn:{' '}
						<span className="text-stone-700 font-semibold">{selectedSlots.size} khung giờ</span>
					</span>
					{savingsBadgeLabel ? (
						<span className="text-[10px] font-semibold bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
							{savingsBadgeLabel}
						</span>
					) : null}
				</div>

				{/* Pricing breakdown box */}
				<div className="mb-2 bg-stone-50 border border-stone-200 rounded-lg overflow-hidden">
					<div className="px-3 py-1.5 flex justify-between items-center">
						<span className="text-xs text-stone-500">Giá gốc</span>
						<span className="text-xs text-stone-700">{toKDisplay(pricing.basePrice)}</span>
					</div>
					{pricing.discountPercent > 0 && (
						<div className="px-3 py-1.5 flex justify-between items-center">
							<span className="text-xs text-green-600">
								Ưu đãi chương trình (-{Math.round(pricing.discountPercent * 100)}%)
							</span>
							<span className="text-xs text-green-600">-{toKDisplay(pricing.discountAmount)}</span>
						</div>
					)}
					{pricing.comboPercent > 0 && (
						<div className="px-3 py-1.5 flex justify-between items-center">
							<span className="text-xs text-green-600">
								Giảm giá combo (-{Math.round(pricing.comboPercent * 100)}%)
							</span>
							<span className="text-xs text-green-600">-{toKDisplay(pricing.comboDiscount)}</span>
						</div>
					)}
					{pricing.weekdayDiscountAmount > 0 && (
						<div className="px-3 py-1.5 flex justify-between items-center">
							<span className="text-xs text-green-600">Chương trình ưu đãi theo tuần (-20k/đơn)</span>
							<span className="text-xs text-green-600">-{toKDisplay(pricing.weekdayDiscountAmount)}</span>
						</div>
					)}
					<div className="border-t border-stone-200 px-3 py-2 flex justify-between items-center">
						<span className="text-xs text-stone-500">Tổng tiền</span>
						<span className="text-xl font-bold text-[#D97D48]">{toKDisplay(pricing.totalAmount)}</span>
					</div>
					{pricing.savings > 0 && (
						<div className="px-3 pb-2 flex justify-end">
							<span className="text-[10px] font-semibold bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
								Bạn đã tiết kiệm được {toKDisplay(pricing.savings)} 🟢
							</span>
						</div>
					)}
				</div>

				{/* Book button */}
				<button
					onClick={onBookNow}
					disabled={isCopied}
					className={`w-full px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${isCopied ? 'bg-green-600' : 'hover:opacity-90'}`}
					style={!isCopied ? { backgroundColor: '#D97D48' } : undefined}
				>
					{isCopied ? (
						<>
							<Check className="w-5 h-5" />
							<span>Đã SAO CHÉP, hãy DÁN khung giờ bạn đã chọn vào messenger</span>
						</>
					) : (
						<>
							<Image src={messengerIcon} alt="Messenger" width={26} height={26} />
							<span>Đặt ngay</span>
						</>
					)}
				</button>
			</div>
		</motion.div>
	);
}

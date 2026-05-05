'use client';

import messengerIcon from '@/assets/icon-messenger.png';
import { getSavingsBadgeLabel, toKDisplay } from '@/lib/pricingUtils';
import type { PricingPreviewBreakdown } from '@/types/pricing';
import { motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import Image from 'next/image';

interface MobileBookingBarProps {
	selectedSlots: Set<string>;
	pricing: PricingPreviewBreakdown;
	isCopied: boolean;
	onBookNow: () => void;
	roomName: string;
	selectedDate: string;
	selectedTimeRange: string;
	comboNotification: string | null;
}

export default function MobileBookingBar({
	selectedSlots,
	pricing,
	isCopied,
	onBookNow,
	roomName,
	selectedDate,
	selectedTimeRange,
	comboNotification,
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
				<div className="mb-2 border border-stone-200 rounded-lg bg-stone-50 p-2">
					<p className="text-[11px] text-stone-500">
						Phòng: <span className="text-stone-700 font-semibold">{roomName || 'N/A'}</span>
					</p>
					<p className="text-[11px] text-stone-500 mt-0.5">
						Ngày: <span className="text-stone-700 font-semibold">{selectedDate || 'N/A'}</span>
					</p>
					<p className="text-[11px] text-stone-500 mt-0.5">
						Khung giờ: <span className="text-stone-700 font-semibold">{selectedTimeRange || 'N/A'} ({selectedSlots.size} slot)</span>
					</p>
				</div>

				<div className="flex items-center justify-between mb-2">
					<span className="text-xs text-stone-500">
						Đã chọn: <span className="text-stone-700 font-semibold">{selectedSlots.size} khung giờ</span>
					</span>
					{savingsBadgeLabel ? (
						<span className="text-[10px] font-semibold bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
							{savingsBadgeLabel}
						</span>
					) : null}
				</div>

				{comboNotification ? (
					<div className="mb-2 rounded-md bg-emerald-50 px-2.5 py-2 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
						{comboNotification}
					</div>
				) : null}

				<div className="mb-2 bg-stone-50 border border-stone-200 rounded-lg overflow-hidden">
					<div className="px-3 py-1.5 flex justify-between items-center">
						<span className="text-xs text-stone-500">Giá gốc</span>
						<span className="text-xs text-stone-700">{toKDisplay(pricing.basePrice)}</span>
					</div>
					{pricing.programDiscountAmount > 0 && (
						<div className="px-3 py-1.5 flex justify-between items-center">
							<span className="text-xs text-green-600">
								{pricing.appliedProgram?.program.name || 'Giảm giá chương trình'}
							</span>
							<span className="text-xs text-green-600">-{toKDisplay(pricing.programDiscountAmount)}</span>
						</div>
					)}
					{pricing.comboDiscountAmount > 0 && (
						<div className="px-3 py-1.5 flex justify-between items-center">
							<span className="text-xs text-green-600">Combo liên tiếp (-{Math.round(pricing.comboPercent)}%)</span>
							<span className="text-xs text-green-600">-{toKDisplay(pricing.comboDiscountAmount)}</span>
						</div>
					)}
					<div className="border-t border-stone-200 px-3 py-2 flex justify-between items-center">
						<span className="text-xs text-stone-500">Tạm tính</span>
						<span className="text-xl font-bold text-[#D97D48]">{toKDisplay(pricing.totalAmount)}</span>
					</div>
				</div>

				<button
					onClick={onBookNow}
					disabled={isCopied}
					className={`w-full px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${isCopied ? 'bg-green-600' : 'hover:opacity-90'}`}
					style={!isCopied ? { backgroundColor: '#D97D48' } : undefined}
				>
					{isCopied ? (
						<>
							<Check className="w-5 h-5" />
							<span>Đã sao chép! Dán vào Messenger</span>
						</>
					) : (
						<>
							<Image src={messengerIcon} alt="Messenger" width={26} height={26} />
							<span>Đặt ngay</span>
						</>
					)}
				</button>
			</div>
			<p className="text-[9px] text-stone-400 text-center pb-3 flex items-center justify-center gap-0.5">
				<Copy className="w-2.5 h-2.5" />
				Sao chép & dán vào Messenger
			</p>
		</motion.div>
	);
}

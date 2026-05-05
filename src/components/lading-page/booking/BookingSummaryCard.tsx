'use client';

import messengerIcon from '@/assets/icon-messenger.png';
import { getSavingsBadgeLabel, toKDisplay } from '@/lib/pricingUtils';
import type { PricingPreviewBreakdown } from '@/types/pricing';
import { Card } from '@mantine/core';
import { motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import Image from 'next/image';

interface SlotItem {
	label: string;
	price: number;
}

interface BookingSummaryCardProps {
	selectedSlots: Set<string>;
	pricing: PricingPreviewBreakdown;
	isCopied: boolean;
	onBookNow: () => void;
	roomName: string;
	selectedDate: string;
	selectedTimeRange: string;
	slotItems: SlotItem[];
	comboNotification: string | null;
}

export default function BookingSummaryCard({
	selectedSlots,
	pricing,
	isCopied,
	onBookNow,
	roomName,
	selectedDate,
	selectedTimeRange,
	slotItems,
	comboNotification,
}: BookingSummaryCardProps) {
	if (selectedSlots.size === 0) return null;

	const savingsBadgeLabel = getSavingsBadgeLabel(pricing);

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			className="hidden md:block"
		>
			<Card shadow="lg" radius="md" className="border border-stone-200 w-[420px]" p={0}>
				<div className="bg-white rounded-md overflow-hidden p-3">
					<div className="mb-3 border border-stone-200 rounded-lg bg-stone-50 p-3">
						<p className="text-xs text-stone-500">
							Phòng: <span className="text-stone-700 font-semibold">{roomName || 'N/A'}</span>
						</p>
						<p className="text-xs text-stone-500 mt-1">
							Ngày: <span className="text-stone-700 font-semibold">{selectedDate || 'N/A'}</span>
						</p>
						<p className="text-xs text-stone-500 mt-1">
							Khung giờ: <span className="text-stone-700 font-semibold">{selectedTimeRange || 'N/A'} ({selectedSlots.size} slot)</span>
						</p>
					</div>

					<div className="flex justify-between items-center mb-2">
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
						<div className="mb-3 rounded-md bg-emerald-50 px-2.5 py-2 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
							{comboNotification}
						</div>
					) : null}

					<div className="mb-3 bg-stone-50 border border-stone-200 rounded-lg overflow-hidden">
						{slotItems.map((slot, index) => (
							<div key={`${slot.label}-${index}`} className="px-3 py-1.5 flex justify-between items-center">
								<span className="text-xs text-stone-500">{slot.label}</span>
								<span className="text-xs text-stone-700">{toKDisplay(slot.price)}</span>
							</div>
						))}

						<div className="px-3 py-1.5 flex justify-between items-center border-t border-stone-200">
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
								<span className="text-xs text-green-600">
									Combo liên tiếp (-{Math.round(pricing.comboPercent)}%)
								</span>
								<span className="text-xs text-green-600">-{toKDisplay(pricing.comboDiscountAmount)}</span>
							</div>
						)}

						<div className="border-t border-stone-200 px-3 py-2 flex justify-between items-center">
							<span className="text-xs text-stone-500">Tạm tính</span>
							<span className="text-xl font-bold text-[#D97D48]">{toKDisplay(pricing.totalAmount)}</span>
						</div>

						{pricing.savings > 0 && (
							<div className="px-3 pb-2 flex justify-end">
								<span className="text-[10px] font-semibold bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
									Bạn đã tiết kiệm được {toKDisplay(pricing.savings)}
								</span>
							</div>
						)}
					</div>

					<button
						onClick={onBookNow}
						disabled={isCopied}
						className={`w-full px-6 py-2.5 rounded-md font-medium text-white transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${isCopied ? 'bg-green-600 hover:bg-green-600' : 'hover:bg-[#c06b3d]'
							}`}
						style={!isCopied ? { backgroundColor: '#D97D48' } : undefined}
					>
						{isCopied ? (
							<>
								<Check className="w-5 h-5" />
								<span>Đã sao chép! Dán vào Messenger</span>
							</>
						) : (
							<>
								<Image src={messengerIcon} alt="Messenger" width={30} height={30} />
								<span>Đặt ngay</span>
							</>
						)}
					</button>
					<p className="text-[9px] text-stone-400 mt-1 flex items-center justify-center gap-0.5">
						<Copy className="w-2.5 h-2.5" />
						Sao chép & dán vào Messenger
					</p>
				</div>
			</Card>
		</motion.div>
	);
}

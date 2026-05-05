'use client';

import messengerIcon from '@/assets/icon-messenger.png';
import { getSavingsBadgeLabel, toKDisplay } from '@/lib/pricingUtils';
import type { PricingPreviewBreakdown } from '@/types/pricing';
import { Card } from '@mantine/core';
import { motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import Image from 'next/image';

interface BookingSummaryCardProps {
	selectedSlots: Set<string>;
	pricing: PricingPreviewBreakdown;
	isPricingLoading?: boolean;
	isCopied: boolean;
	onBookNow: () => void;
}

export default function BookingSummaryCard({
	selectedSlots,
	pricing,
	isPricingLoading = false,
	isCopied,
	onBookNow,
}: BookingSummaryCardProps) {
	if (selectedSlots.size === 0) return null;

	const savingsBadgeLabel = getSavingsBadgeLabel(pricing);

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			className="hidden md:block"
		>
			<Card shadow="lg" radius="md" className="border border-stone-200 w-[380px]" p={0}>
				<div className="bg-white rounded-md overflow-hidden p-3">
					<div className="flex justify-between items-center mb-2">
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

					<div className="mb-3 bg-stone-50 border border-stone-200 rounded-lg overflow-hidden">
						{isPricingLoading && (
							<div className="px-3 py-1.5 text-[11px] text-stone-500 border-b border-stone-200">
								Đang cập nhật giá tạm tính...
							</div>
						)}
						<div className="px-3 py-1.5 flex justify-between items-center">
							<span className="text-xs text-stone-500">Giá gốc</span>
							<span className="text-xs text-stone-700">{toKDisplay(pricing.basePrice)}</span>
						</div>
						{pricing.holidaySurchargeAmount > 0 && (
							<div className="px-3 py-1.5 flex justify-between items-center">
								<span className="text-xs text-amber-700">Phụ thu ngày lễ</span>
								<span className="text-xs text-amber-700">+{toKDisplay(pricing.holidaySurchargeAmount)}</span>
							</div>
						)}
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
									{pricing.comboPercent > 0
										? `Giảm giá combo (-${Math.round(pricing.comboPercent)}%)`
										: 'Giảm giá combo'}
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

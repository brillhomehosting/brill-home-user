'use client';

import messengerIcon from '@/assets/icon-messenger.png';
import { getHolidaySurchargeLabel, getSavingsBadgeLabel, toKDisplay } from '@/lib/pricingUtils';
import type { PricingPreviewBreakdown } from '@/types/pricing';
import { Card } from '@mantine/core';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface BookingSummaryCardProps {
	selectedSlots: Set<string>;
	pricing: PricingPreviewBreakdown;
	isPricingLoading?: boolean;
	onBookNow: () => void;
}

export default function BookingSummaryCard({
	selectedSlots,
	pricing,
	isPricingLoading = false,
	onBookNow,
}: BookingSummaryCardProps) {
	if (selectedSlots.size === 0) return null;

	const savingsBadgeLabel = getSavingsBadgeLabel(pricing);
	const holidaySurchargeLabel = getHolidaySurchargeLabel(pricing);

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
								<span className="text-xs text-amber-700">{holidaySurchargeLabel}</span>
								<span className="text-xs text-amber-700">+{toKDisplay(pricing.holidaySurchargeAmount)}</span>
							</div>
						)}
						{pricing.programDiscountAmount > 0 && (() => {
							// Group discount by program ID -> hiển thị từng campaign riêng
							const programGroups = new Map<string, { name: string; amount: number }>();
							pricing.dailyBreakdown.forEach(day => {
								if (day.appliedProgram && day.programDiscountAmount > 0) {
									const id = day.appliedProgram.program.id;
									const existing = programGroups.get(id);
									if (existing) {
										existing.amount += day.programDiscountAmount;
									} else {
										programGroups.set(id, {
											name: day.appliedProgram.program.name,
											amount: day.programDiscountAmount,
										});
									}
								}
							});

							if (programGroups.size > 1) {
								return Array.from(programGroups.values()).map(({ name, amount }) => (
									<div key={name} className="px-3 py-1.5 flex justify-between items-center">
										<span className="text-xs text-green-600">{name}</span>
										<span className="text-xs text-green-600">-{toKDisplay(amount)}</span>
									</div>
								));
							}

							return (
								<div className="px-3 py-1.5 flex justify-between items-center">
									<span className="text-xs text-green-600">
										{pricing.appliedProgram?.program.name || 'Giảm giá chương trình'}
									</span>
									<span className="text-xs text-green-600">-{toKDisplay(pricing.programDiscountAmount)}</span>
								</div>
							);
						})()}
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
						className="w-full px-6 py-2.5 rounded-md font-medium text-white transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer hover:bg-[#c06b3d]"
						style={{ backgroundColor: '#D97D48' }}
					>
						<Image src={messengerIcon} alt="Messenger" width={30} height={30} />
						<span>Đặt ngay</span>
					</button>
					<p className="text-[9px] text-stone-400 mt-1 text-center">
						Mở popup để copy nội dung và chọn app gửi tin
					</p>
				</div>
			</Card>
		</motion.div>
	);
}

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
	isPricingLoading?: boolean;
	isCopied: boolean;
	onBookNow: () => void;
}

export default function MobileBookingBar({
	selectedSlots,
	pricing,
	isPricingLoading = false,
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

				<div className="mb-2 bg-stone-50 border border-stone-200 rounded-lg overflow-hidden">
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
					{pricing.programDiscountAmount > 0 && (() => {
						// Group discount by program ID → hiển thị từng campaign riêng
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

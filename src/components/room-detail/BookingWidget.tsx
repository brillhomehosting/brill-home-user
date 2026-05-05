'use client';

import messengerIcon from '@/assets/icon-messenger.png';
import { contactData } from '@/data/contact-data';
import { useActiveDiscountPrograms } from '@/hooks/useActiveDiscountPrograms';
import { useComboDiscounts } from '@/hooks/useComboDiscounts';
import { useSSEAvailability } from '@/hooks/useSSEAvailability';
import { useTimeSlotAvailability } from '@/hooks/useTimeSlotAvailability';
import { buildBookingMessage } from '@/lib/buildBookingMessage';
import { calculatePricing, getComboNotification, getSavingsBadgeLabel, toKDisplay } from '@/lib/pricingUtils';
import { applySlotSelection, getSelectionContext, LinearSelectableSlot, parseSlotKey } from '@/lib/slotSelection';
import { useAvailabilityStore } from '@/store/availabilityStore';
import { Room, TimeSlot } from '@/types/room';
import { PricingSelectedSlot } from '@/types/pricing';
import type { SlotStatus } from '@/types/timeslot';
import { Card, Table } from '@mantine/core';
import { motion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

type IndexedPricingSlot = PricingSelectedSlot & { index: number };

const generateDates = (count: number) => {
	return Array.from({ length: count }, (_, i) => {
		const date = new Date();
		date.setDate(date.getDate() + i);
		return date;
	});
};

const getDayLabel = (date: Date) => {
	const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
	return days[date.getDay()];
};

const formatDate = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

const isToday = (date: Date) => {
	const today = new Date();
	return date.toDateString() === today.toDateString();
};

const getTimeSlotIcon = (startTime: string, isOvernight: boolean): string => {
	if (isOvernight) return '🌙';
	const hour = parseInt(startTime.split(':')[0] || '12', 10);
	if (hour >= 5 && hour < 17) return '☀️';
	if (hour >= 17 && hour < 21) return '🌆';
	return '🌙';
};

const isEndPastSlot = (date: Date, endTime: string, isOvernight: boolean): boolean => {
	if (!isToday(date)) return false;
	const now = new Date();
	const timeParts = endTime.split(':');
	const hours = parseInt(timeParts[0] || '0', 10);
	const minutes = parseInt(timeParts[1] || '0', 10);
	const endDate = new Date();
	endDate.setHours(hours, minutes, 0, 0);
	if (isOvernight) endDate.setDate(endDate.getDate() + 1);
	return now > endDate;
};

const isDateBeforeToday = (date: Date) => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const compareDate = new Date(date);
	compareDate.setHours(0, 0, 0, 0);
	return compareDate < today;
};

const TODAY_ROW_BOX_SHADOW = '0 0 18px rgba(154,52,18,0.24), 0 0 30px rgba(251,146,60,0.18)';
const TODAY_SLOT_BOX_SHADOW = '0 6px 12px rgba(15,118,110,0.88), 0 -2px 5px rgba(13,148,136,0.40)';

function LoadingSkeleton() {
	return (
		<div className="animate-pulse p-4">
			<div className="flex gap-2">
				<div className="shrink-0">
					<div className="h-6 w-16 bg-muted/50 rounded mb-2" />
					{Array.from({ length: 7 }).map((_, i) => (
						<div key={i} className="h-10 w-16 bg-muted/30 rounded mb-1" />
					))}
				</div>
				<div className="flex gap-2 overflow-hidden flex-1">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="flex-1">
							<div className="h-6 bg-muted/50 rounded mb-2" />
							{Array.from({ length: 7 }).map((_, j) => (
								<div key={j} className="h-10 bg-muted/30 rounded mb-1" />
							))}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function toPercentValue(value: number): number {
	return value <= 1 ? value * 100 : value;
}

export default function BookingWidget({ room }: { room: Room }) {
	const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
	const [currentDatePage, setCurrentDatePage] = useState(0);
	const [slotPrices, setSlotPrices] = useState<Map<string, number>>(new Map());
	const [isCopied, setIsCopied] = useState(false);
	const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const allDates = generateDates(30);
	const DATES_PER_PAGE = 7;
	const totalPages = Math.ceil(allDates.length / DATES_PER_PAGE);
	const pagedDates = allDates.slice(
		currentDatePage * DATES_PER_PAGE,
		(currentDatePage + 1) * DATES_PER_PAGE
	);
	const shouldShowYesterdayRow = new Date().getHours() < 19;
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	const dates = currentDatePage === 0 && shouldShowYesterdayRow ? [yesterday, ...pagedDates] : pagedDates;

	const startDate = formatDate(dates[0] || new Date());
	const endDate = formatDate(dates[dates.length - 1] || new Date());

	const { data: availabilityData, isLoading: isLoadingAvailability } = useTimeSlotAvailability(room.id, startDate, endDate);

	useSSEAvailability([room.id]);

	const getStoreSlotStatus = useAvailabilityStore(s => s.getSlotStatus);

	const timeSlots = useMemo(() => {
		if (!availabilityData || !Array.isArray(availabilityData) || availabilityData.length === 0) return [];
		const firstDay = availabilityData.find(day => day?.timeSlots?.length);
		if (!firstDay?.timeSlots) return [];

		return firstDay.timeSlots
			.map(ts => ts.timeSlot)
			.filter(Boolean)
			.sort((a, b) => {
				const timeA = parseInt(a.startTime.replace(':', ''), 10);
				const timeB = parseInt(b.startTime.replace(':', ''), 10);
				return timeA - timeB;
			});
	}, [availabilityData]);

	const getSlotStatusForDate = (date: Date, slotId: string): SlotStatus => {
		const dateStr = formatDate(date);
		return getStoreSlotStatus(room.id, dateStr, slotId);
	};

	const getLinearSlots = (): LinearSelectableSlot[] => {
		if (!timeSlots.length) return [];
		const linearList: LinearSelectableSlot[] = [];

		pagedDates.forEach(date => {
			const dateStr = formatDate(date);
			const dayData = availabilityData?.find(day => day.date === dateStr);

			timeSlots.forEach(slot => {
				const slotFromDay = dayData?.timeSlots?.find(s => s.timeSlot.id === slot.id);
				const slotStatus = getSlotStatusForDate(date, slot.id);
				const dynamicPrice = slotFromDay?.timeSlot?.price ?? slot.price;
				const isAvailable = slotStatus === 'AVAILABLE'
					&& !isDateBeforeToday(date)
					&& !isEndPastSlot(date, slot.endTime, slot.isOvernight);

				linearList.push({
					key: `${room.id}::${dateStr}::${slot.id}`,
					roomId: room.id,
					date: dateStr,
					slotId: slot.id,
					price: dynamicPrice,
					isAvailable,
				});
			});
		});

		return linearList;
	};

	const selectionContext = useMemo(() => getSelectionContext(selectedSlots), [selectedSlots]);
	const selectedDate = selectionContext?.date ?? null;

	const { data: comboDiscounts = [], isLoading: isLoadingComboDiscounts } = useComboDiscounts();
	const { data: activeDiscountPrograms = [] } = useActiveDiscountPrograms(room.id, selectedDate);

	const selectedPricingSlots = useMemo((): PricingSelectedSlot[] => {
		if (selectedSlots.size === 0) return [];

		const linearSlots = getLinearSlots();
		const indexByKey = new Map(linearSlots.map((slot, index) => [slot.key, index]));
		const priceByKey = new Map(linearSlots.map((slot) => [slot.key, slot.price]));
		const slotMap = new Map(timeSlots.map((slot) => [slot.id, slot]));

		return Array.from(selectedSlots)
			.map((slotKey) => {
				const parsed = parseSlotKey(slotKey);
				if (!parsed) return null;

				const slot = slotMap.get(parsed.slotId);
				if (!slot) return null;

				const indexedSlot: IndexedPricingSlot = {
					key: slotKey,
					roomId: parsed.roomId,
					date: parsed.date,
					slotId: parsed.slotId,
					startTime: slot.startTime,
					endTime: slot.endTime,
					price: slotPrices.get(slotKey) ?? priceByKey.get(slotKey) ?? slot.price,
					isOvernight: slot.isOvernight,
					index: indexByKey.get(slotKey) ?? Number.MAX_SAFE_INTEGER,
				};
				return indexedSlot;
			})
			.filter((slot): slot is IndexedPricingSlot => Boolean(slot))
			.sort((a, b) => a.index - b.index)
			.map(({ index, ...slot }) => slot);
	}, [selectedSlots, slotPrices, timeSlots, availabilityData, pagedDates]); // eslint-disable-line react-hooks/exhaustive-deps

	const pricing = useMemo(
		() => calculatePricing({
			selectedSlots: selectedPricingSlots,
			comboDiscounts,
			activePrograms: activeDiscountPrograms,
			roomId: room.id,
			roomType: room.roomType,
		}),
		[selectedPricingSlots, comboDiscounts, activeDiscountPrograms, room.id, room.roomType],
	);

	useEffect(() => {
		setSelectedSlots(new Set());
		setSlotPrices(new Map());
	}, [currentDatePage]);

	const handleSlotClick = (date: Date, slotId: string) => {
		const slotKey = `${room.id}::${formatDate(date)}::${slotId}`;
		const linearSlots = getLinearSlots();
		const result = applySlotSelection({
			linearSlots,
			selectedSlots,
			clickedKey: slotKey,
		});

		setSelectedSlots(result.selectedSlots);
		setSlotPrices(result.slotPrices);
	};

	const buildMessengerMessage = () => {
		if (selectedPricingSlots.length === 0) return '';

		const groupedByDate: Record<string, { timeRange: string; price: string }[]> = {};
		selectedPricingSlots.forEach(slot => {
			const dateDisplay = new Date(`${slot.date}T00:00:00`).toLocaleDateString('vi-VN');
			if (!groupedByDate[dateDisplay]) groupedByDate[dateDisplay] = [];
			groupedByDate[dateDisplay]!.push({
				timeRange: `${slot.startTime} - ${slot.endTime}`,
				price: `${Math.round(slot.price / 1000)}k`,
			});
		});

		return buildBookingMessage({
			roomName: room.name,
			groupedByDate,
			totalAmount: pricing.totalAmount,
		});
	};

	const handleBookNow = useCallback(async () => {
		if (selectedSlots.size === 0 || isCopied) return;

		const message = buildMessengerMessage();
		if (!message) return;

		try {
			await navigator.clipboard.writeText(message);
			setIsCopied(true);

			if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
			copiedTimeoutRef.current = setTimeout(() => setIsCopied(false), 4000);

			toast.success('Đã sao chép thông tin đặt phòng!', {
				description: 'Mở Messenger và dán (Ctrl+V) tin nhắn để gửi cho chúng tôi.',
				duration: 5000,
			});

			setTimeout(() => {
				window.open(`https://m.me/${contactData.messengerId}`, '_blank');
			}, 600);
		} catch {
			try {
				const textarea = document.createElement('textarea');
				textarea.value = message;
				textarea.style.position = 'fixed';
				textarea.style.opacity = '0';
				document.body.appendChild(textarea);
				textarea.select();
				document.execCommand('copy');
				document.body.removeChild(textarea);

				setIsCopied(true);
				if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
				copiedTimeoutRef.current = setTimeout(() => setIsCopied(false), 4000);

				toast.success('Đã sao chép thông tin đặt phòng!', {
					description: 'Mở Messenger và dán (Ctrl+V) tin nhắn để gửi cho chúng tôi.',
					duration: 5000,
				});

				setTimeout(() => {
					window.open(`https://m.me/${contactData.messengerId}`, '_blank');
				}, 600);
			} catch {
				toast.error('Không thể sao chép. Vui lòng thử lại.', { duration: 3000 });
				window.open(`https://m.me/${contactData.messengerId}`, '_blank');
			}
		}
	}, [selectedSlots, isCopied, pricing.totalAmount, selectedPricingSlots, contactData.messengerId]); // eslint-disable-line react-hooks/exhaustive-deps

	const comboSummary = getComboNotification(selectedPricingSlots.length, pricing.comboPercent);
	const savingsBadgeLabel = getSavingsBadgeLabel(pricing);
	const selectedDateDisplay = selectedDate ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString('vi-VN') : '';
	const selectedTimeRange = selectedPricingSlots.length > 0
		? `${selectedPricingSlots[0]?.startTime} - ${selectedPricingSlots[selectedPricingSlots.length - 1]?.endTime}`
		: '';

	const isLoading = isLoadingAvailability;

	return (
		<Card
			shadow="lg"
			className="overflow-hidden border border-stone-200 bg-white rounded-xl"
			p={0}
		>
			<div className="flex items-center justify-between p-3 border-b border-stone-200 bg-stone-50">
				<button
					onClick={() => setCurrentDatePage(prev => Math.max(0, prev - 1))}
					disabled={currentDatePage === 0}
					className="p-1.5 rounded hover:bg-stone-200 disabled:opacity-30 disabled:hover:bg-transparent text-stone-600 transition-colors"
				>
					<ChevronLeft className="w-4 h-4" />
				</button>
				<span className="text-xs font-semibold text-stone-700" suppressHydrationWarning>
					{dates[0]?.getDate()}/{dates[0]?.getMonth()! + 1} - {dates[dates.length - 1]?.getDate()}/{dates[dates.length - 1]?.getMonth()! + 1}
				</span>
				<button
					onClick={() => setCurrentDatePage(prev => Math.min(totalPages - 1, prev + 1))}
					disabled={currentDatePage >= totalPages - 1}
					className="p-1.5 rounded hover:bg-stone-200 disabled:opacity-30 disabled:hover:bg-transparent text-stone-600 transition-colors"
				>
					<ChevronRight className="w-4 h-4" />
				</button>
			</div>

			{isLoading ? (
				<LoadingSkeleton />
			) : !timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0 ? (
				<div className="text-center py-8 text-stone-400">
					Chưa có khung giờ nào được cấu hình cho phòng này
				</div>
			) : (
				<div className="max-h-[400px] overflow-auto">
					<Table
						striped
						highlightOnHover
						withTableBorder
						withColumnBorders
						stickyHeader
						className="min-w-max"
					>
						<Table.Thead>
							<Table.Tr>
								<Table.Th
									className="sticky left-0 z-30 p-0! min-w-[60px]"
									style={{ backgroundColor: '#FAF9F6', borderRight: '1px solid #E7E5E4' }}
								>
									<div className="flex items-center justify-center h-full w-full py-2 bg-[#FAF9F6]">
										<span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
											Ngày
										</span>
									</div>
								</Table.Th>
								{timeSlots.map((slot: TimeSlot) => (
									<Table.Th
										key={slot.id}
										className="text-center min-w-[70px] p-1.5"
										style={{ backgroundColor: '#FAF9F6' }}
									>
										<div className="flex flex-col items-center gap-0.5">
											<span className="text-[10px] font-semibold text-stone-600">
												{slot.startTime}-{slot.endTime}
											</span>
											<span className="text-[10px] opacity-70">
												{getTimeSlotIcon(slot.startTime, slot.isOvernight)} {toKDisplay(slot.price)}
											</span>
										</div>
									</Table.Th>
								))}
							</Table.Tr>
						</Table.Thead>

						<Table.Tbody>
							{dates.map((date, dateIdx) => {
								const isTodayRow = isToday(date);
								return (
									<Table.Tr key={dateIdx} className="group transition-colors">
										<Table.Td
											className="sticky left-0 z-20 p-0!"
											style={{
												backgroundColor: isTodayRow ? '#FAFAF8' : '#FFFFFF',
												borderRight: '1px solid #E7E5E4',
											}}
										>
											<div className={`
												flex flex-col items-center justify-center py-2 px-1 h-full
												${isTodayRow ? 'border-l-3 border-l-[#D97D48]' : 'border-l-3 border-l-transparent'}
											`}
												style={isTodayRow ? { boxShadow: TODAY_ROW_BOX_SHADOW } : undefined}
											>
												<span className={`text-[10px] font-bold uppercase tracking-wide ${isTodayRow ? 'text-[#D97D48]' : 'text-stone-500'}`} suppressHydrationWarning>
													{isTodayRow ? 'Nay' : getDayLabel(date)}
												</span>
												<span className={`text-xs font-semibold ${isTodayRow ? 'text-[#D97D48]' : 'text-stone-600'}`} suppressHydrationWarning>
													{date.getDate()}/{date.getMonth() + 1}
												</span>
											</div>
										</Table.Td>

										{timeSlots.map((slot: TimeSlot) => {
											const slotKey = `${room.id}::${formatDate(date)}::${slot.id}`;
											const isSelected = selectedSlots.has(slotKey);
											const slotStatus = getSlotStatusForDate(date, slot.id);
											const isPastDateRow = isDateBeforeToday(date);
											const isEndPast = isEndPastSlot(date, slot.endTime, slot.isOvernight);
											const isAvailable = slotStatus === 'AVAILABLE' && !isEndPast;
											const canInteract = !isPastDateRow && isAvailable;
											const isBooked = slotStatus === 'BOOKED';
											const isHolding = slotStatus === 'HOLDING';

											const dayData = availabilityData?.find(day => day.date === formatDate(date));
											const dynamicPrice = dayData?.timeSlots?.find(s => s.timeSlot.id === slot.id)?.timeSlot?.price ?? slot.price;

											return (
												<Table.Td
													key={slot.id}
													className="text-center p-1.5 align-middle"
													style={{
														backgroundColor: isTodayRow ? '#FAFAF8' : '#FFFFFF',
													}}
												>
													<button
														onClick={() => canInteract && handleSlotClick(date, slot.id)}
														disabled={!canInteract}
														className={`
															w-full h-[32px] rounded font-medium text-xs transition-all duration-200 flex flex-col items-center justify-center gap-0.5 shadow-sm
															${isSelected
																? 'bg-[#D97D48] text-white shadow-md border border-[#D97D48]'
																: isHolding
																	? 'bg-amber-50 text-amber-700 border border-amber-300 cursor-not-allowed shadow-none'
																	: isBooked
																		? 'bg-[#CF5B51] text-white border border-transparent cursor-not-allowed shadow-none'
																		: canInteract
																			? 'bg-white text-teal-700 border border-teal-200 hover:border-teal-500 hover:shadow-md'
																			: 'bg-white text-teal-700 border border-teal-200 cursor-not-allowed shadow-none'
															}
														`}
														style={isTodayRow ? {
															boxShadow: TODAY_SLOT_BOX_SHADOW,
														} : undefined}
													>
														{isHolding ? (
															<span className="text-[10px] font-semibold">Đang giữ</span>
														) : isBooked && !isPastDateRow ? (
															<span className="text-[10px] font-semibold">Đã đặt</span>
														) : !isPastDateRow && isAvailable ? (
															<span className="font-bold">{toKDisplay(dynamicPrice)}</span>
														) : null}
													</button>
												</Table.Td>
											);
										})}
									</Table.Tr>
								);
							})}
						</Table.Tbody>
					</Table>
				</div>
			)}

			<div className="flex items-center justify-center gap-4 py-2 px-3 border-t border-stone-200 bg-stone-50">
				<div className="flex items-center gap-1.5">
					<div className="w-3 h-3 rounded-full bg-white border border-teal-400"></div>
					<span className="text-[10px] text-stone-600">Còn trống</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="w-3 h-3 rounded-full bg-[#D97D48]"></div>
					<span className="text-[10px] text-stone-600">Đang chọn</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="w-3 h-3 rounded-full bg-amber-400"></div>
					<span className="text-[10px] text-stone-600">Đang giữ</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="w-3 h-3 rounded-full bg-red-400"></div>
					<span className="text-[10px] text-stone-600">Đã đặt</span>
				</div>
			</div>

			<div className="flex flex-wrap items-center justify-center gap-1.5 py-1.5 px-3 bg-stone-50 border-t border-stone-200 text-[10px] text-stone-500">
				{isLoadingComboDiscounts ? (
					<span>Đang tải ưu đãi combo...</span>
				) : comboDiscounts.length > 0 ? (
					<>
						<span>Ưu đãi combo:</span>
						{[...comboDiscounts]
							.sort((a, b) => a.minSlots - b.minSlots)
							.map((tier, index) => (
								<span key={`${tier.minSlots}-${index}`} className="text-green-600 font-semibold">
									{tier.minSlots} khung → -{Math.round(toPercentValue(tier.discountPercent))}%
									{tier.flatDiscount > 0 ? ` và -${toKDisplay(tier.flatDiscount)}` : ''}
								</span>
							))}
					</>
				) : (
					<span>Chưa có ưu đãi combo.</span>
				)}
			</div>

			{selectedSlots.size > 0 && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: 'auto' }}
					className="border-t border-stone-200 p-3"
				>
					<div className="mb-3 border border-stone-200 rounded-lg bg-stone-50 p-3">
						<p className="text-xs text-stone-500">
							Phòng: <span className="text-stone-700 font-semibold">{room.name}</span>
						</p>
						<p className="text-xs text-stone-500 mt-1">
							Ngày: <span className="text-stone-700 font-semibold">{selectedDateDisplay || 'N/A'}</span>
						</p>
						<p className="text-xs text-stone-500 mt-1">
							Khung giờ: <span className="text-stone-700 font-semibold">{selectedTimeRange || 'N/A'} ({selectedSlots.size} slot)</span>
						</p>
					</div>

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

					{comboSummary ? (
						<div className="mb-3 rounded-md bg-emerald-50 px-2.5 py-2 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
							{comboSummary}
						</div>
					) : null}

					<div className="mb-3 bg-stone-50 border border-stone-200 rounded-lg overflow-hidden">
						{selectedPricingSlots.map((slot) => (
							<div key={slot.key} className="px-3 py-1.5 flex justify-between items-center">
								<span className="text-xs text-stone-500">{slot.startTime} - {slot.endTime}</span>
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
								<span className="text-xs text-green-600">Combo liên tiếp (-{Math.round(pricing.comboPercent)}%)</span>
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
						onClick={handleBookNow}
						disabled={isCopied}
						className={`w-full px-4 py-2.5 rounded-lg font-medium text-white transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${isCopied ? 'bg-green-600 hover:bg-green-600' : 'hover:opacity-90'
							}`}
						style={!isCopied ? { backgroundColor: '#D97D48' } : undefined}
					>
						{isCopied ? (
							<>
								<Check className="w-5 h-5" />
								Đã sao chép! Dán vào Messenger
							</>
						) : (
							<>
								<Image src={messengerIcon} alt="Messenger" width={24} height={24} />
								Đặt phòng ngay
							</>
						)}
					</button>
					<p className="text-[10px] text-stone-400 text-center mt-1.5">
						<Copy className="w-3 h-3 inline mr-1" />
						Nhấn để sao chép & mở Messenger — dán tin nhắn để đặt phòng
					</p>
				</motion.div>
			)}

			{selectedSlots.size === 0 && !isLoading && timeSlots && Array.isArray(timeSlots) && timeSlots.length > 0 && (
				<div className="p-3 border-t border-stone-200">
					<p className="text-[10px] text-stone-400 text-center">
						Chọn khung giờ để đặt phòng
					</p>
				</div>
			)}
		</Card>
	);
}

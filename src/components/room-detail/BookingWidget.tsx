'use client';

import messengerIcon from '@/assets/icon-messenger.png';
import { DISCOUNT_PROGRAM_PERCENT, WEEKDAY_SLOT_DISCOUNT } from '@/constants/pricing';
import { contactData } from '@/data/contact-data';
import { useTimeSlotAvailability } from '@/hooks/useTimeSlotAvailability';
import { buildBookingMessage } from '@/lib/buildBookingMessage';
import { calculatePricing, getSavingsBadgeLabel, isEligibleForWeeklyDiscount, isInDiscountProgram, toKDisplay } from '@/lib/pricingUtils';
import { Room, TimeSlot } from '@/types/room';
import { Card, Table } from '@mantine/core';
import { motion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

// Generate dates for next N days
const generateDates = (count: number) => {
	return Array.from({ length: count }, (_, i) => {
		const date = new Date();
		date.setDate(date.getDate() + i);
		return date;
	});
};

// Vietnamese day labels - short version
const getDayLabel = (date: Date) => {
	const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
	return days[date.getDay()];
};

// Helper function to format date as YYYY-MM-DD
const formatDate = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

// Check if date is today
const isToday = (date: Date) => {
	const today = new Date();
	return date.toDateString() === today.toDateString();
};

// Get icon for time slot based on time
const getTimeSlotIcon = (startTime: string, isOvernight: boolean): string => {
	if (isOvernight) return '🌙';
	const hour = parseInt(startTime.split(':')[0] || '12', 10);
	if (hour >= 5 && hour < 12) return '☀️';
	if (hour >= 12 && hour < 17) return '☀️';
	if (hour >= 17 && hour < 21) return '🌅';
	return '🌙';
};

// Check if slot's end time has passed (for today only)
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

// Loading Skeleton
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

export default function BookingWidget({ room }: { room: Room }) {
	// Calendar Booking States
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

	// Calculate start and end dates for the availability API call
	const startDate = formatDate(dates[0] || new Date());
	const endDate = formatDate(dates[dates.length - 1] || new Date());

	// Use availability API only (contains full time slot info)
	const { data: availabilityData, isLoading: isLoadingAvailability } = useTimeSlotAvailability(room.id, startDate, endDate);

	// Derive unique time slots from availability data
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

	// Get availability status for a specific timeslot on a specific date
	const getSlotAvailability = (date: Date, slotId: string): boolean => {
		if (!availabilityData || !Array.isArray(availabilityData)) return true;
		const dateStr = formatDate(date);
		const dayData = availabilityData.find(d => d.date === dateStr);
		if (!dayData) return true;
		const slotStatus = dayData.timeSlots.find(s => s.timeSlot.id === slotId);
		return slotStatus?.isActive ?? true;
	};

	const pricing = useMemo(
		() => calculatePricing(slotPrices, selectedSlots),
		[slotPrices, selectedSlots],
	);

	// Build linear list of slots for adjacency checks
	const getLinearSlots = () => {
		if (!timeSlots.length) return [];
		const linearList: { key: string; price: number }[] = [];
		pagedDates.forEach(date => {
			timeSlots.forEach(slot => {
				linearList.push({
					key: `${room.id}::${formatDate(date)}::${slot.id}`,
					price: slot.price,
				});
			});
		});
		return linearList;
	};

	// Handle slot click — consecutive only
	const handleSlotClick = (date: Date, slotId: string, price: number) => {
		const slotKey = `${room.id}::${formatDate(date)}::${slotId}`;
		const linearSlots = getLinearSlots();
		const clickedSlotIndex = linearSlots.findIndex(s => s.key === slotKey);
		if (clickedSlotIndex === -1) return;

		setSelectedSlots(prev => {
			const newSet = new Set(prev);

			// A. DESELECTION
			if (newSet.has(slotKey)) {
				if (newSet.size === 1) {
					newSet.clear();
					setSlotPrices(new Map());
					return newSet;
				}
				const selectedIndices = linearSlots
					.map((s, i) => newSet.has(s.key) ? i : -1)
					.filter(i => i !== -1);
				const minIdx = Math.min(...selectedIndices);
				const maxIdx = Math.max(...selectedIndices);

				if (clickedSlotIndex === minIdx || clickedSlotIndex === maxIdx) {
					newSet.delete(slotKey);
					setSlotPrices(prev => {
						const newPrices = new Map(prev);
						newPrices.delete(slotKey);
						return newPrices;
					});
				} else {
					// Clicked middle -> trim tail
					const remainingIndices = selectedIndices.filter(i => i < clickedSlotIndex);
					const newSetReset = new Set<string>();
					const newPricesReset = new Map<string, number>();
					remainingIndices.forEach(idx => {
						const s = linearSlots[idx];
						if (s) {
							newSetReset.add(s.key);
							newPricesReset.set(s.key, s.price);
						}
					});
					setSlotPrices(newPricesReset);
					return newSetReset;
				}
				return newSet;
			}

			// B. SELECTION
			if (newSet.size === 0) {
				newSet.add(slotKey);
				setSlotPrices(new Map([[slotKey, price]]));
				return newSet;
			}

			// Check adjacency
			const selectedIndices = linearSlots
				.map((s, i) => newSet.has(s.key) ? i : -1)
				.filter(i => i !== -1);
			const minIdx = Math.min(...selectedIndices);
			const maxIdx = Math.max(...selectedIndices);
			const isAdjacent = clickedSlotIndex === minIdx - 1 || clickedSlotIndex === maxIdx + 1;

			if (isAdjacent) {
				newSet.add(slotKey);
				setSlotPrices(prev => {
					const newPrices = new Map(prev);
					newPrices.set(slotKey, price);
					return newPrices;
				});
			} else {
				// Not adjacent -> reset to just the new slot
				newSet.clear();
				newSet.add(slotKey);
				setSlotPrices(new Map([[slotKey, price]]));
			}
			return newSet;
		});
	};

	const totalAmount = pricing.totalAmount;
	const showDiscountBanner = pagedDates.some(d => isInDiscountProgram(formatDate(d)));
	const savingsBadgeLabel = getSavingsBadgeLabel(pricing);

	// Build Messenger message with booking details
	const buildMessengerMessage = () => {
		if (selectedSlots.size === 0) return '';

		const slotsInfo = Array.from(selectedSlots).map(slotKey => {
			const parts = slotKey.split('::');
			if (parts.length !== 3) return null;
			const [, dateStr, slotId] = parts as [string, string, string];
			const date = new Date(dateStr + 'T00:00:00');
			const price = slotPrices.get(slotKey);

			const timeSlot = timeSlots?.find(s => s.id === slotId);
			const timeRange = timeSlot ? `${timeSlot.startTime} - ${timeSlot.endTime}` : '';

			return {
				date: date.toLocaleDateString('vi-VN'),
				timeRange,
				price: price ? `${price / 1000}k` : ''
			};
		}).filter(Boolean) as { date: string; timeRange: string; price: string }[];

		const groupedByDate: Record<string, { timeRange: string; price: string }[]> = {};
		slotsInfo.forEach(slot => {
			if (!groupedByDate[slot.date]) {
				groupedByDate[slot.date] = [];
			}
			groupedByDate[slot.date]!.push({ timeRange: slot.timeRange, price: slot.price });
		});

		return buildBookingMessage({ roomName: room.name, groupedByDate, totalAmount });
	};

	// Copy booking details to clipboard and open Messenger
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
			// Fallback: try execCommand for older browsers
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
	}, [selectedSlots, isCopied, buildMessengerMessage, contactData.messengerId]);  // eslint-disable-line react-hooks/exhaustive-deps

	const isLoading = isLoadingAvailability;

	return (
		<Card
			shadow="lg"
			className="overflow-hidden border border-stone-200 bg-white rounded-xl"
			p={0}
		>
			{/* Header with Pagination */}
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

			{/* Loading State */}
			{isLoading ? (
				<LoadingSkeleton />
			) : !timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0 ? (
				<div className="text-center py-8 text-stone-400">
					Chưa có khung giờ nào được cấu hình cho phòng này
				</div>
			) : (
				/* Table Layout */
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
								{/* Date Column Header */}
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
								{/* Time Slot Headers */}
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
												{getTimeSlotIcon(slot.startTime, slot.isOvernight)} {slot.price / 1000}k
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
										{/* Sticky Date Column */}
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

										{/* Time Slots */}
										{timeSlots.map((slot: TimeSlot) => {
											const slotKey = `${room.id}::${formatDate(date)}::${slot.id}`;
											const isSelected = selectedSlots.has(slotKey);
											const isApiActive = getSlotAvailability(date, slot.id);
											const isPastDateRow = isDateBeforeToday(date);
											const isEndPast = isEndPastSlot(date, slot.endTime, slot.isOvernight);
											const isActive = isApiActive && !isEndPast;
											const canInteract = !isPastDateRow && isActive;
											const isBooked = !isApiActive;
												const isDiscount = isInDiscountProgram(formatDate(date));
											const isWeeklyDiscount = isEligibleForWeeklyDiscount(formatDate(date));
											const promoAdjustedPrice = isDiscount
												? Math.round(slot.price * (1 - DISCOUNT_PROGRAM_PERCENT))
												: slot.price;
											const displayPrice = Math.max(
												0,
												promoAdjustedPrice - (isWeeklyDiscount ? WEEKDAY_SLOT_DISCOUNT : 0),
											);
											const priceInK = Math.round(displayPrice / 1000);

											return (
												<Table.Td
													key={slot.id}
													className="text-center p-1.5 align-middle"
													style={{
														backgroundColor: isTodayRow ? '#FAFAF8' : '#FFFFFF',
													}}
												>
														<button
															onClick={() => canInteract && handleSlotClick(date, slot.id, slot.price)}
															disabled={!canInteract}
															className={`
																w-full h-[32px] rounded font-medium text-xs transition-all duration-200 flex flex-col items-center justify-center gap-0.5 shadow-sm
																${isSelected
																	? 'bg-[#D97D48] text-white shadow-md border border-[#D97D48]'
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
														{!isPastDateRow && isApiActive ? (
															<span className="font-bold">{priceInK}k</span>
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

			{/* Legend */}
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
					<div className="w-3 h-3 rounded-full bg-red-400"></div>
					<span className="text-[10px] text-stone-600">Đã đặt</span>
				</div>
			</div>

			{/* Info Banner */}
			{!isLoading && timeSlots && Array.isArray(timeSlots) && timeSlots.length > 0 && (
				showDiscountBanner ? (
					<div className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-green-50 border-t border-green-200 text-[10px] text-green-700">
						<span className="font-semibold">🎁 Khuyến mãi: Giảm {Math.round(DISCOUNT_PROGRAM_PERCENT * 100)}% tất cả đặt phòng từ 2/3 - 5/3/2026</span>
						<span>·</span>
						<span className="font-semibold">Thứ 2 - Thứ 6: -20k/đơn</span>
					</div>
				) : (
					<div className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-stone-50 border-t border-stone-200 text-[10px] text-stone-500">
						<span>Ưu đãi combo:</span>
						<span className="text-green-600 font-semibold">2 khung → -5%</span>
						<span>·</span>
						<span className="text-green-600 font-semibold">3 khung → -10%</span>
						<span>·</span>
						<span className="text-green-600 font-semibold">4+ khung → -20%</span>
						<span>·</span>
						<span className="text-green-600 font-semibold">Thứ 2 - Thứ 6 → -20k/đơn</span>
					</div>
				)
			)}

			{/* Booking Summary */}
			{selectedSlots.size > 0 && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: 'auto' }}
					className="border-t border-stone-200 p-3"
				>
					{/* Header row */}
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

					{/* Pricing breakdown box */}
					<div className="mb-3 bg-stone-50 border border-stone-200 rounded-lg overflow-hidden">
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

			{/* Empty State */}
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

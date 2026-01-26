'use client';

import messengerIcon from '@/assets/icon-messenger.png';
import { useRoomTimeSlots } from '@/hooks/useRoomTimeSlots';
import { useTimeSlotAvailability } from '@/hooks/useTimeSlotAvailability';
import { DayAvailability, Room, TimeSlot } from '@/types/room';
import { Card, Table } from '@mantine/core';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

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

// Check if slot is past (for today only)
const isPastSlot = (date: Date, startTime: string): boolean => {
	if (!isToday(date)) return false;

	const now = new Date();
	const timeParts = startTime.split(':');
	const hours = parseInt(timeParts[0] || '0', 10);
	const minutes = parseInt(timeParts[1] || '0', 10);
	const slotTime = new Date();
	slotTime.setHours(hours, minutes, 0, 0);

	return now > slotTime;
};

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

	const allDates = generateDates(30);
	const DATES_PER_PAGE = 7;
	const totalPages = Math.ceil(allDates.length / DATES_PER_PAGE);
	const dates = allDates.slice(
		currentDatePage * DATES_PER_PAGE,
		(currentDatePage + 1) * DATES_PER_PAGE
	);

	// Calculate start and end dates for the availability API call
	const startDate = formatDate(dates[0] || new Date());
	const endDate = formatDate(dates[dates.length - 1] || new Date());

	// Use reusable hooks
	const { data: timeSlots, isLoading: isLoadingTimeSlots } = useRoomTimeSlots(room.id);
	const { data: availabilityData } = useTimeSlotAvailability(room.id, startDate, endDate);

	console.log('BookingWidget Debug:', { roomId: room.id, timeSlots, isLoadingTimeSlots, availabilityData });

	// Get availability status for a specific timeslot on a specific date
	const getSlotAvailability = (date: Date, slotId: string): boolean => {
		if (!availabilityData || !Array.isArray(availabilityData)) return true;
		const dateStr = formatDate(date);
		const dayData = availabilityData.find((d: DayAvailability) => d.date === dateStr);
		if (!dayData) return true;
		const slotStatus = dayData.timeSlots.find(s => s.timeSlot.id === slotId);
		return slotStatus?.isActive ?? true;
	};

	// Get the first and last slot in current selection (sorted by date)
	const getSelectionBounds = (slots: Set<string>) => {
		if (slots.size === 0) return null;

		const sortedSlots = Array.from(slots).sort((a, b) => {
			const partsA = a.split('::') as [string, string];
			const partsB = b.split('::') as [string, string];
			const [dateA] = partsA;
			const [dateB] = partsB;

			const dateTimeA = new Date(dateA).getTime();
			const dateTimeB = new Date(dateB).getTime();

			return dateTimeA - dateTimeB;
		});

		return {
			first: sortedSlots[0]!,
			last: sortedSlots[sortedSlots.length - 1]!,
		};
	};

	// Calculate total from selected slots using stored prices
	const calculateTotal = () => {
		let total = 0;
		selectedSlots.forEach(slotKey => {
			const price = slotPrices.get(slotKey);
			if (price !== undefined) {
				total += price / 1000;
			}
		});
		return total;
	};

	// Handle slot click
	const handleSlotClick = (date: Date, slotId: string, price: number) => {
		const slotKey = `${formatDate(date)}::${slotId}`;

		setSelectedSlots(prev => {
			const newSet = new Set(prev);

			// If clicking on already selected slot
			if (newSet.has(slotKey)) {
				const bounds = getSelectionBounds(newSet);
				// Only allow deselecting from the start or end
				if (bounds && (slotKey === bounds.first || slotKey === bounds.last)) {
					newSet.delete(slotKey);
					setSlotPrices(prev => {
						const newPrices = new Map(prev);
						newPrices.delete(slotKey);
						return newPrices;
					});
				}
				return newSet;
			}

			// If no slots selected, start new selection
			if (newSet.size === 0) {
				newSet.add(slotKey);
				setSlotPrices(new Map([[slotKey, price]]));
				return newSet;
			}

			// Add the new slot
			newSet.add(slotKey);
			setSlotPrices(prev => {
				const newPrices = new Map(prev);
				newPrices.set(slotKey, price);
				return newPrices;
			});
			return newSet;
		});
	};

	const totalAmount = calculateTotal();

	// Build Messenger message with booking details
	const buildMessengerMessage = () => {
		if (selectedSlots.size === 0) return '';

		const slotsInfo = Array.from(selectedSlots).map(slotKey => {
			const parts = slotKey.split('::');
			if (parts.length !== 2) return null;
			const [dateStr, slotId] = parts as [string, string];
			const date = new Date(dateStr);
			const price = slotPrices.get(slotKey);

			// Find the time slot to get start/end time
			const timeSlot = timeSlots?.find(s => s.id === slotId);
			const timeRange = timeSlot ? `${timeSlot.startTime} - ${timeSlot.endTime}` : '';

			return {
				date: date.toLocaleDateString('vi-VN'),
				timeRange,
				price: price ? `${price / 1000}k` : ''
			};
		}).filter(Boolean);

		const groupedByDate: Record<string, { timeRange: string; price: string }[]> = {};
		slotsInfo.forEach(slot => {
			if (slot) {
				if (!groupedByDate[slot.date]) {
					groupedByDate[slot.date] = [];
				}
				groupedByDate[slot.date]!.push({ timeRange: slot.timeRange, price: slot.price });
			}
		});

		let message = `ĐẶT PHÒNG HOMESTAY\n\n`;
		message += `Phòng: ${room.name}\n\n`;
		message += `Khung giờ:\n`;

		Object.entries(groupedByDate).forEach(([date, slots]) => {
			message += `${date}:\n`;
			slots.forEach(slot => {
				message += `  - ${slot.timeRange} (${slot.price})\n`;
			});
		});

		message += `\nTổng: ${totalAmount}k`;

		return message;
	};

	// Open Messenger with booking details
	const handleBookNow = async () => {
		if (selectedSlots.size > 0) {
			const facebookPageId = '61585984563658';
			const message = buildMessengerMessage();
			const encodedMessage = encodeURIComponent(message);

			// Copy to clipboard as backup
			try {
				await navigator.clipboard.writeText(message);
			} catch {
				// Ignore clipboard errors
			}

			// Open Messenger with pre-filled message
			window.open(`https://m.me/${facebookPageId}?text=${encodedMessage}`, '_blank');
		}
	};

	// Only wait for timeSlots to load, availability can load in background
	const isLoading = isLoadingTimeSlots;

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
				<span className="text-xs font-semibold text-stone-700">
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
												backgroundColor: isTodayRow ? '#FFF7ED' : '#FFFFFF',
												borderRight: '1px solid #E7E5E4'
											}}
										>
											<div className={`
												flex flex-col items-center justify-center py-2 px-1 h-full
												${isTodayRow ? 'border-l-3 border-l-[#D97D48]' : 'border-l-3 border-l-transparent'}
											`}>
												<span className={`text-[10px] font-bold uppercase tracking-wide ${isTodayRow ? 'text-[#D97D48]' : 'text-stone-500'}`}>
													{isTodayRow ? 'Nay' : getDayLabel(date)}
												</span>
												<span className={`text-xs font-semibold ${isTodayRow ? 'text-stone-800' : 'text-stone-600'}`}>
													{date.getDate()}/{date.getMonth() + 1}
												</span>
											</div>
										</Table.Td>

										{/* Time Slots */}
										{timeSlots.map((slot: TimeSlot) => {
											const slotKey = `${formatDate(date)}::${slot.id}`;
											const isSelected = selectedSlots.has(slotKey);
											const isApiActive = getSlotAvailability(date, slot.id);
											// Check if slot is past for today
											const isPast = isPastSlot(date, slot.startTime);
											const isActive = isApiActive && !isPast;
											const priceInK = slot.price / 1000;

											return (
												<Table.Td
													key={slot.id}
													className="text-center p-1.5 align-middle"
													style={{ backgroundColor: isTodayRow ? '#FFFBF5' : undefined }}
												>
													<button
														onClick={() => isActive && handleSlotClick(date, slot.id, slot.price)}
														disabled={!isActive}
														className={`
															w-full h-[32px] rounded font-medium text-xs transition-all duration-200 flex items-center justify-center shadow-sm
															${!isActive
																? 'bg-red-200 text-red-500 border border-transparent cursor-not-allowed shadow-none'
																: isSelected
																	? 'bg-[#D97D48] text-white shadow-md border border-[#D97D48]'
																	: 'bg-white text-teal-700 border border-teal-200 hover:border-teal-500 hover:shadow-md hover:bg-teal-50'
															}
														`}
													>
														{isActive ? (
															<span className="font-bold">{priceInK}k</span>
														) : isPast ? (
															<span className="text-[12px] font-bold"></span>
														) : (
															<span className="text-[12px] font-bold">Đã đặt</span>
														)}
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
					<div className="w-3 h-3 rounded-full bg-red-500"></div>
					<span className="text-[10px] text-stone-600">Đã đặt</span>
				</div>
			</div>

			{/* Booking Summary */}
			{selectedSlots.size > 0 && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: 'auto' }}
					className="border-t border-stone-200 p-3"
				>
					<div className="flex justify-between items-center mb-2">
						<span className="text-xs text-stone-500">Đã chọn:</span>
						<span className="text-xs text-stone-700">{selectedSlots.size} khung giờ</span>
					</div>
					<div className="flex justify-between items-baseline mb-3">
						<span className="text-xs text-stone-500">Tổng cộng</span>
						<span className="text-xl font-bold text-[#D97D48]">{totalAmount}k</span>
					</div>
					<button
						onClick={handleBookNow}
						className="w-full px-4 py-2.5 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2 hover:opacity-90 cursor-pointer"
						style={{ backgroundColor: '#D97D48' }}
					>
						<Image src={messengerIcon} alt="Messenger" width={24} height={24} />
						Đặt phòng ngay
					</button>
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

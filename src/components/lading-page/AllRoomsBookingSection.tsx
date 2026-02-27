'use client';

import messengerIcon from '@/assets/icon-messenger.png';
import { DISCOUNT_PROGRAM_PERCENT } from '@/constants/pricing';
import { useRooms } from '@/hooks/useRooms';
import { useRoomsAvailability } from '@/hooks/useRoomsAvailability';
import { useRoomsTimeSlots } from '@/hooks/useRoomsTimeSlots';
import { buildBookingMessage } from '@/lib/buildBookingMessage';
import { calculatePricing, isInDiscountProgram, toKDisplay } from '@/lib/pricingUtils';
import { TimeSlot } from '@/types/room';
import { Card, Table } from '@mantine/core';
import { motion } from 'framer-motion';
import { CalendarClock, Check, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBookingUIStore } from '@/store/bookingUIStore';
import { toast } from 'sonner';
import { contactData } from '../../data/contact-data';

// --- HELPER FUNCTIONS ---

// Generate dates for next N days
const generateDates = (count: number) => {
	return Array.from({ length: count }, (_, i) => {
		const date = new Date();
		date.setDate(date.getDate() + i);
		return date;
	});
};

// Vietnamese day labels - short version for mobile
const getDayLabel = (date: Date) => {
	const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
	return days[date.getDay()];
};

// Format date as YYYY-MM-DD
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
	if (hour >= 5 && hour < 12) return '☀️'; // Sáng
	if (hour >= 12 && hour < 17) return '☀️'; // Trưa
	if (hour >= 17 && hour < 21) return '🌅'; // Chiều tối
	return '🌙'; // Đêm
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
					<div className="h-6 w-20 bg-muted/50 rounded mb-2" />
					{Array.from({ length: 7 }).map((_, i) => (
						<div key={i} className="h-10 w-24 bg-muted/30 rounded mb-1" />
					))}
				</div>
				<div className="flex gap-4 overflow-hidden">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i}>
							<div className="h-6 w-[260px] bg-muted/50 rounded mb-2" />
							{Array.from({ length: 7 }).map((_, j) => (
								<div key={j} className="flex gap-1 mb-1">
									{Array.from({ length: 4 }).map((_, k) => (
										<div key={k} className="h-10 w-[70px] bg-muted/30 rounded" />
									))}
								</div>
							))}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

// --- MAIN COMPONENT ---

export default function AllRoomsBookingSection() {
	const { data: rooms, isLoading } = useRooms();
	const [currentDatePage, setCurrentDatePage] = useState(0);
	const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
	const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
	const [slotPrices, setSlotPrices] = useState<Map<string, number>>(new Map());
	const [isCopied, setIsCopied] = useState(false);
	const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const setMobileBookingBarVisible = useBookingUIStore(s => s.setMobileBookingBarVisible);

	useEffect(() => {
		setMobileBookingBarVisible(selectedSlots.size > 0);
		return () => setMobileBookingBarVisible(false);
	}, [selectedSlots.size, setMobileBookingBarVisible]);

	const DATES_PER_PAGE = 7;
	const allDates = generateDates(30);
	const totalPages = Math.ceil(allDates.length / DATES_PER_PAGE);
	const dates = allDates.slice(
		currentDatePage * DATES_PER_PAGE,
		(currentDatePage + 1) * DATES_PER_PAGE
	);

	// Calculate start and end dates for the availability API call
	const startDate = formatDate(dates[0] || new Date());
	const endDate = formatDate(dates[dates.length - 1] || new Date());

	// Use availability API for booking status, time-slots API for prices
	const { data: roomAvailabilityMap, isLoading: isLoadingAvailability } = useRoomsAvailability(rooms, startDate, endDate);
	const { data: roomTimeSlotsApiMap } = useRoomsTimeSlots(rooms);

	// Derive unique time slots per room from availability data
	const roomTimeSlotsMap = useMemo(() => {
		const map = new Map<string, TimeSlot[]>();
		if (!rooms) return map;

		rooms.forEach(room => {
			const availabilityData = roomAvailabilityMap.get(room.id);
			if (!availabilityData || availabilityData.length === 0) return;

			// Extract unique time slots from the first day's data
			const firstDay = availabilityData[0];
			if (!firstDay?.timeSlots) return;

			const slots = firstDay.timeSlots
				.map(ts => ts.timeSlot)
				.filter(Boolean)
				.sort((a, b) => {
					const timeA = parseInt(a.startTime.replace(':', ''), 10);
					const timeB = parseInt(b.startTime.replace(':', ''), 10);
					return timeA - timeB;
				});

			map.set(room.id, slots);
		});

		return map;
	}, [rooms, roomAvailabilityMap]);

	// --- LOGIC: CONSECUTIVE SLOT SELECTION ---

	// Helper to flatten all slots for a specific room into a linear list (sorted by time)
	const getLinearSlots = (roomId: string) => {
		const timeSlots = roomTimeSlotsMap.get(roomId) || [];
		if (!timeSlots.length) return [];

		const availabilityData = roomAvailabilityMap.get(roomId);
		const linearList: { key: string; price: number; isActive: boolean; date: Date; slotId: string }[] = [];

		dates.forEach(date => {
			const dateStr = formatDate(date);
			const dayData = availabilityData?.find(d => d.date === dateStr);

			timeSlots.forEach(slot => {
				const slotStatus = dayData?.timeSlots?.find(s => s?.timeSlot?.id === slot.id);
				const isActive = slotStatus?.isActive ?? true;
				const dynamicPrice = slotStatus?.timeSlot?.price ?? slot.price;

				linearList.push({
					key: `${roomId}::${dateStr}::${slot.id}`,
					price: dynamicPrice,
					isActive: isActive,
					date: date,
					slotId: slot.id
				});
			});
		});

		return linearList;
	};

	const pricing = useMemo(
		() => calculatePricing(slotPrices, selectedSlots),
		[slotPrices, selectedSlots],
	);

	const handleSlotClick = (roomId: string, _date: Date, _slotId: string, _price: number) => {
		// If switching rooms, reset everything immediately
		if (selectedRoomId && selectedRoomId !== roomId) {
			const clickedKey = `${roomId}::${formatDate(_date)}::${_slotId}`;
			setSelectedRoomId(roomId);
			setSelectedSlots(new Set([clickedKey]));
			setSlotPrices(new Map([[clickedKey, _price]]));
			return;
		}

		// Initial selection
		if (!selectedRoomId) {
			setSelectedRoomId(roomId);
		}

		const clickedKey = `${roomId}::${formatDate(_date)}::${_slotId}`;
		const linearSlots = getLinearSlots(roomId);
		const clickedSlotIndex = linearSlots.findIndex(s => s.key === clickedKey);

		if (clickedSlotIndex === -1) return; // Should not happen

		setSelectedSlots(prev => {
			const newSet = new Set(prev);

			// A. DESELECTION LOGIC
			if (newSet.has(clickedKey)) {
				// We can only deselect if it's the FIRST or LAST slot of the current consecutive chain.
				// If we deselect the middle, it breaks the chain -> Invalid for "Consecutive only".
				// Actually, simpler user experience: If you click an already selected slot:
				// 1. If it's an edge, shrink selection.
				// 2. If it's middle, maybe clear selection or do nothing? 
				// Let's implement: "Shrink from the side clicked" strategy is complex.
				// Simple strategy: Deselecting checks if it leaves a gap. If yes, reset or disallow.

				// Let's get current sorted indices
				const selectedIndices = linearSlots
					.map((s, i) => newSet.has(s.key) ? i : -1)
					.filter(i => i !== -1);

				const minIdx = Math.min(...selectedIndices);
				const maxIdx = Math.max(...selectedIndices);

				// If it's the only slot
				if (newSet.size === 1) {
					newSet.clear();
					setSelectedRoomId(null);
					setSlotPrices(new Map());
					return newSet;
				}

				// If click is min or max, just remove it
				if (clickedSlotIndex === minIdx || clickedSlotIndex === maxIdx) {
					newSet.delete(clickedKey);
					// Update prices
					setSlotPrices(prevPrices => {
						const newPrices = new Map(prevPrices);
						newPrices.delete(clickedKey);
						return newPrices;
					});
					return newSet;
				}

				// If click is in the middle -> User might be trying to split.
				// Approach: Deselect everything EXCEPT the clicked one? Or do nothing?
				// "Reset to just this slot" is a common pattern for re-selecting.
				// But here they clicked ON it. Maybe they want to cancel?
				// Let's just create a new selection of ONLY this slot to imply "Restarting selection".
				// OR prevent action. Let's Prevent action for stability, or Deselect All.
				// Let's try: Deselect this and everything after it (Trim Tail).
				// E.g. [1, 2, 3, 4, 5]. Click 3. Result [1, 2].
				// This is intuitive for "shortening the duration".

				// Actually, let's implement the standard: Uncheck = Remove.
				// But we must enforce consecutive.
				// If remove 3 from 1-5, we get 1-2 and 4-5. 
				// We should keep the larger chunk? Or just keep 1-2 (Head).
				// Strategy: Keep the segment from Start to Click-1.
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

				// If we cleared everything? (e.g. clicked first item)
				if (newSetReset.size === 0) {
					setSelectedRoomId(null);
				}

				return newSetReset;
			}

			// B. SELECTION (ADD) LOGIC
			// 1. If no existing selection (already handled by size=0 check if needed, but safe here)
			if (newSet.size === 0) {
				newSet.add(clickedKey);
				setSlotPrices(new Map([[clickedKey, _price]]));
				return newSet;
			}

			// 2. We have existing selection. Get bounds.
			const selectedIndices = linearSlots
				.map((s, i) => newSet.has(s.key) ? i : -1)
				.filter(i => i !== -1);
			const minIdx = Math.min(...selectedIndices);
			const maxIdx = Math.max(...selectedIndices);

			// Check strict adjacency (Must click new slot exactly next to current range)
			const isAdjacent = clickedSlotIndex === minIdx - 1 || clickedSlotIndex === maxIdx + 1;

			if (isAdjacent) {
				newSet.add(clickedKey);
				setSlotPrices(prev => {
					const newPrices = new Map(prev);
					newPrices.set(clickedKey, _price);
					return newPrices;
				});
			} else {
				// Not adjacent -> Reset selection to just the new slot
				newSet.clear();
				newSet.add(clickedKey);
				setSlotPrices(new Map([[clickedKey, _price]]));
			}

			return newSet;
		});
	};

	const selectedRoom = rooms?.find(r => r.id === selectedRoomId);
	const showDiscountBanner = dates.some(d => isInDiscountProgram(formatDate(d)));

	const buildMessengerMessage = () => {
		if (!selectedRoom || selectedSlots.size === 0) return '';

		const staticSlots = roomTimeSlotsMap.get(selectedRoomId!) || [];

		const slotsInfo = Array.from(selectedSlots).map(slotKey => {
			const parts = slotKey.split('::');
			const [, dateStr, slotId] = parts;
			const date = new Date(dateStr + 'T00:00:00');
			const price = slotPrices.get(slotKey);

			const timeSlot = staticSlots.find(s => s.id === slotId);
			const timeRange = timeSlot ? `${timeSlot.startTime} - ${timeSlot.endTime}` : '';

			return {
				date: date.toLocaleDateString('vi-VN'),
				timeRange,
				price: price ? `${price / 1000}k` : ''
			};
		});

		const groupedByDate: Record<string, { timeRange: string; price: string }[]> = {};
		slotsInfo.forEach(slot => {
			if (!groupedByDate[slot.date]) groupedByDate[slot.date] = [];
			groupedByDate[slot.date]!.push({ timeRange: slot.timeRange, price: slot.price });
		});

		return buildBookingMessage({ roomName: selectedRoom.name, groupedByDate, totalAmount: pricing.totalAmount });
	};

	const handleBookNow = useCallback(async () => {
		if (!selectedRoomId || selectedSlots.size === 0 || isCopied) return;

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
				window.open(`https://m.me/${contactData.facebookPageId}`, '_blank');
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
					window.open(`https://m.me/${contactData.facebookPageId}`, '_blank');
				}, 600);
			} catch {
				toast.error('Không thể sao chép. Vui lòng thử lại.', { duration: 3000 });
				window.open(`https://m.me/${contactData.facebookPageId}`, '_blank');
			}
		}
	}, [selectedRoomId, selectedSlots, isCopied, buildMessengerMessage]);  // eslint-disable-line react-hooks/exhaustive-deps

	const sortedRooms = useMemo(() => {
		if (!rooms) return [];

		return [...rooms].sort((a, b) => {
			const slotsA = roomTimeSlotsMap.get(a.id) || [];
			const slotsB = roomTimeSlotsMap.get(b.id) || [];

			// Helper: Get earliest start time value (e.g. 9:30 -> 930)
			const getEarliestTime = (slots: typeof slotsA) => {
				if (!slots.length) return Infinity; // No slots -> push to end
				return Math.min(...slots.map(s => parseInt(s.startTime.replace(':', ''), 10)));
			};

			const timeA = getEarliestTime(slotsA);
			const timeB = getEarliestTime(slotsB);

			// Sort by time first
			if (timeA !== timeB) return timeA - timeB;

			// Fallback to name
			return a.name.localeCompare(b.name);
		});
	}, [rooms, roomTimeSlotsMap]);

	return (
		<section id="booking-table" className="py-12 md:py-20">
			<div className="container mx-auto px-4 max-w-[1400px]">
				{/* Header Section */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8"
				>
					<div className="text-center lg:text-left">
						<span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#d4af37] font-bold mb-3">
							<CalendarClock className="w-4 h-4" />
							Đặt phòng nhanh
						</span>
						<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-medium leading-snug md:leading-tight text-background mb-3 md:mb-4">
							Lịch trống các phòng
						</h2>
						<p className="text-background/80 max-w-xl md:max-w-2xl mx-auto md:mx-0 leading-relaxed text-sm md:text-base">
							Xem lịch trống và đặt phòng nhanh chóng.
						</p>
					</div>

					{/* Pagination Controls */}
					<div className="flex items-center gap-2 self-start lg:self-auto bg-white p-1 rounded-lg border border-stone-200 shadow-sm">
						<button
							onClick={() => setCurrentDatePage(prev => Math.max(0, prev - 1))}
							disabled={currentDatePage === 0}
							className="p-2 rounded hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent text-stone-600 transition-colors"
						>
							<ChevronLeft className="w-5 h-5" />
						</button>
						<span className="text-sm font-semibold text-stone-700 min-w-[120px] text-center px-2 border-x border-stone-100">
							{dates[0]?.getDate()}/{dates[0]?.getMonth()! + 1} - {dates[dates.length - 1]?.getDate()}/{dates[dates.length - 1]?.getMonth()! + 1}
						</span>
						<button
							onClick={() => setCurrentDatePage(prev => Math.min(totalPages - 1, prev + 1))}
							disabled={currentDatePage >= totalPages - 1}
							className="p-2 rounded hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent text-stone-600 transition-colors"
						>
							<ChevronRight className="w-5 h-5" />
						</button>
					</div>
				</motion.div>

				{/* Main Table Card */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ delay: 0.1 }}
				>
					<Card
						shadow="sm"
						radius="md"
						className="bg-white border border-stone-200 overflow-hidden p-0!"
					>
						{(isLoading || isLoadingAvailability) ? (
							<LoadingSkeleton />
						) : (
							<div className="max-h-[650px] overflow-auto scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent">
								<Table
									striped
									highlightOnHover
									withTableBorder
									withColumnBorders
									stickyHeader
									className="min-w-max"
								>
									<Table.Thead>
										{/* Row 1: Header Rooms */}
										<Table.Tr>
											<Table.Th
												rowSpan={2}
												className="sticky left-0 z-30 p-0! min-w-[80px]"
												style={{ backgroundColor: '#FAF9F6', borderRight: '1px solid #E7E5E4' }}
											>
												<div className="flex items-center justify-center h-full w-full py-4 bg-[#FAF9F6]">
													<span className="text-[10px] md:text-xs font-bold text-stone-500 uppercase tracking-widest">
														Ngày
													</span>
												</div>
											</Table.Th>
											{sortedRooms?.map((room, roomIdx) => {
												const timeSlots = roomTimeSlotsMap.get(room.id) || [];
												// Alternating background for room groups
												const roomBg = roomIdx % 2 === 0 ? '#F5F0E8' : '#FFFFFF';

												return (
													<Table.Th
														key={room.id}
														colSpan={timeSlots.length || 1}
														className="text-center p-0!"
														style={{ backgroundColor: roomBg }}
													>
														<div className="relative h-32 w-full border-b border-stone-200 overflow-hidden group">
															{room.images?.[0]?.url && (
																<>
																	<Image
																		src={room.images[0].url}
																		alt={room.name}
																		fill
																		className="object-cover transition-transform duration-700 group-hover:scale-110"
																		sizes="(max-width: 768px) 100vw, 200px"
																	/>
																	<div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
																</>
															)}
															<div className="absolute inset-0 flex items-center justify-center p-2 z-10">
																<span className="text-white font-bold text-base md:text-lg text-center drop-shadow-md px-2 py-1 bg-black/20 rounded backdrop-blur-[2px]">
																	{room.name}
																</span>
															</div>
														</div>
													</Table.Th>
												);
											})}
										</Table.Tr>

										{/* Row 2: Header Time Slots */}
										<Table.Tr>
											{sortedRooms?.map((room, roomIdx) => {
												const timeSlots = roomTimeSlotsMap.get(room.id) || [];
												const roomBg = roomIdx % 2 === 0 ? '#F5F0E8' : '#FFFFFF';

												if (timeSlots.length === 0) {
													return (
														<Table.Th key={room.id} className="text-center" style={{ backgroundColor: roomBg }}>
															<span className="text-xs text-stone-400 font-normal italic">Trống</span>
														</Table.Th>
													);
												}
												return timeSlots.map((slot) => (
													<Table.Th
														key={slot.id}
														className="text-center min-w-[90px] p-2"
														style={{ backgroundColor: roomBg }}
													>
														<div className="flex flex-col items-center gap-1">
															<span className="text-xs font-semibold text-stone-600 bg-white/50 px-1.5 py-0.5 rounded">
																{slot.startTime}-{slot.endTime}
															</span>
															<span className="text-xs opacity-70">
																{getTimeSlotIcon(slot.startTime, slot.isOvernight)}
															</span>
														</div>
													</Table.Th>
												));
											})}
										</Table.Tr>
									</Table.Thead>

									<Table.Tbody>
										{dates.map((date, dateIdx) => {
											const isTodayRow = isToday(date);
											return (
												<Table.Tr
													key={dateIdx}
													className="group transition-colors"
												>
													{/* Sticky Date Column */}
													<Table.Td
														className="sticky left-0 z-20 p-0!"
														style={{
															backgroundColor: isTodayRow ? '#FFF7ED' : '#FFFFFF', // Orange-50 vs White
															borderRight: '1px solid #E7E5E4'
														}}
													>
														<div className={`
                                                            flex flex-col items-center justify-center py-3 px-2 h-full
                                                            ${isTodayRow ? 'border-l-4 border-l-[#D97D48]' : 'border-l-4 border-l-transparent'}
                                                        `}>
															<span className={`text-xs font-bold uppercase tracking-wide mb-0.5 ${isTodayRow ? 'text-[#D97D48]' : 'text-stone-500'}`}>
																{isTodayRow ? 'Hôm nay' : getDayLabel(date)}
															</span>
															<span className={`text-sm font-semibold ${isTodayRow ? 'text-stone-800' : 'text-stone-600'}`}>
																{date.getDate()}/{date.getMonth() + 1}
															</span>
														</div>
													</Table.Td>

													{/* Room Slots */}
													{sortedRooms?.map((room, roomIdx) => {
														const timeSlots = roomTimeSlotsMap.get(room.id) || [];
														const availabilityData = roomAvailabilityMap.get(room.id);
														// Subtle alternating background for rows/groups
														const cellBg = roomIdx % 2 === 0 ? '#F5F0E8' : '#FFFFFF';

														if (timeSlots.length === 0) {
															return <Table.Td key={room.id} style={{ backgroundColor: cellBg }} />;
														}

														return timeSlots.map((slot) => {
															const slotKey = `${room.id}::${formatDate(date)}::${slot.id}`;
															const isSelected = selectedSlots.has(slotKey);
															const dateStr = formatDate(date);
															const dayData = availabilityData?.find(d => d.date === dateStr);
															const slotStatus = dayData?.timeSlots?.find(s => s?.timeSlot?.id === slot.id);
															const isApiActive = slotStatus?.isActive ?? true;
															// Check if slot is past for today
															const isPast = isPastSlot(date, slot.startTime);
															const isActive = isApiActive && !isPast;
															const baseSlotPrice = roomTimeSlotsApiMap.get(room.id)?.find(s => s.id === slot.id)?.price ?? slot.price;
															const dynamicPrice = baseSlotPrice;

															return (
																<Table.Td
																	key={slot.id}
																	className="text-center p-2 align-middle"
																	style={{ backgroundColor: cellBg }}
																>
																	<button
																		onClick={() => isActive && handleSlotClick(room.id, date, slot.id, dynamicPrice)}
																		disabled={!isActive}
																		className={`
                                                                            w-full h-[36px] rounded font-medium text-sm transition-all duration-200 flex flex-col items-center justify-center gap-0.5 shadow-sm
                                                                            ${!isActive
																				? 'bg-red-200 text-red-500 border border-transparent cursor-not-allowed shadow-none' // UNAVAILABLE (RED)
																				: isSelected
																					? 'bg-[#D97D48] text-white shadow-lg border border-[#D97D48]' // SELECTED
																					: 'bg-white text-teal-700 border border-teal-200 hover:border-teal-500 hover:shadow-md hover:bg-teal-50' // AVAILABLE
																			}
                                                                        `}
																	>
																		{!isApiActive ? (
																			<span className="text-[12px] font-bold">Đã đặt</span>
																		) : null}
																	</button>
																</Table.Td>
															);
														});
													})}
												</Table.Tr>
											);
										})}
									</Table.Tbody>
								</Table>
							</div>
						)}
					</Card>

					{/* Info Banner */}
				<div className="mt-2 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white border border-stone-200 rounded-lg text-[10px] text-stone-500">
					{showDiscountBanner ? (
						<span className="text-green-700 font-semibold">
							🎁 Khuyến mãi: Giảm {Math.round(DISCOUNT_PROGRAM_PERCENT * 100)}% tất cả đặt phòng từ 2/3 - 5/3/2026
						</span>
					) : (
						<>
							<span>Ưu đãi combo:</span>
							<span className="text-green-600 font-semibold">2 khung liên tiếp → -5%</span>
							<span>·</span>
							<span className="text-green-600 font-semibold">3+ khung → -10%</span>
						</>
					)}
				</div>

				{/* Footer: Legend & Action */}
				<div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-6">
					{/* Legend */}
					<div className="flex items-center gap-6 bg-white px-4 py-2 rounded-full border border-stone-200 shadow-sm">
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 rounded-full bg-white border border-teal-400"></div>
							<span className="text-xs text-stone-600">Còn trống</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 rounded-full bg-[#D97D48]"></div>
							<span className="text-xs text-stone-600">Đang chọn</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-3 h-3 rounded-full bg-red-500"></div>
							<span className="text-xs text-stone-600">Đã đặt</span>
						</div>
					</div>

					{/* Booking Summary — desktop inline card */}
					{selectedSlots.size > 0 && (
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							className="hidden md:block"
						>
							<Card shadow="lg" radius="md" className="border border-stone-200 w-[380px]" p={0}>
								<div className="bg-white rounded-md overflow-hidden p-3">
									{/* Header row */}
									<div className="flex justify-between items-center mb-2">
										<span className="text-xs text-stone-500">
											Đã chọn:{' '}
											<span className="text-stone-700 font-semibold">{selectedSlots.size} khung giờ</span>
										</span>
										{pricing.discountPercent > 0 && pricing.comboPercent > 0 ? (
											<span className="text-[10px] font-semibold bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
												2 ưu đãi · Tiết kiệm {toKDisplay(pricing.savings)}
											</span>
										) : pricing.discountPercent > 0 ? (
											<span className="text-[10px] font-semibold bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
												Khuyến mãi -{Math.round(pricing.discountPercent * 100)}%
											</span>
										) : pricing.comboPercent > 0 ? (
											<span className="text-[10px] font-semibold bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
												Combo -{Math.round(pricing.comboPercent * 100)}%{pricing.sameDayFourSlotBonus > 0 ? ' · -250k' : ''}
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
										{pricing.sameDayFourSlotBonus > 0 && (
											<div className="px-3 py-1.5 flex justify-between items-center">
												<span className="text-xs text-green-600">Combo 4 khung cùng ngày</span>
												<span className="text-xs text-green-600">-{toKDisplay(pricing.sameDayFourSlotBonus)}</span>
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
					)}
				</div>

				{/* Mobile spacer — prevents footer being hidden behind the fixed booking bar */}
				{selectedSlots.size > 0 && <div className="h-32 md:hidden" />}
				</motion.div>
			</div>

			{/* Booking Summary — mobile fixed bottom bar */}
			{selectedSlots.size > 0 && (
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
						{pricing.discountPercent > 0 && pricing.comboPercent > 0 ? (
							<span className="text-[10px] font-semibold bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
								2 ưu đãi · Tiết kiệm {toKDisplay(pricing.savings)}
							</span>
						) : pricing.discountPercent > 0 ? (
							<span className="text-[10px] font-semibold bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
								Khuyến mãi -{Math.round(pricing.discountPercent * 100)}%
							</span>
						) : pricing.comboPercent > 0 ? (
							<span className="text-[10px] font-semibold bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
								-{Math.round(pricing.comboPercent * 100)}%{pricing.sameDayFourSlotBonus > 0 ? ' · -250k' : ''}
							</span>
						) : null}
					</div>
					{/* Row 2: price + book button */}
					<div className="flex items-center justify-between gap-3">
						<div className="flex flex-col gap-0.5 min-w-0">
							<span className="font-bold text-lg text-[#D97D48] leading-none">
								{toKDisplay(pricing.totalAmount)}
							</span>
							{pricing.savings > 0 && (
								<span className="text-[10px] font-semibold text-green-600">
									Tiết kiệm {toKDisplay(pricing.savings)} 🟢
								</span>
							)}
						</div>
						<button
							onClick={handleBookNow}
							disabled={isCopied}
							className={`shrink-0 px-5 py-2.5 rounded-lg font-medium text-white transition-all duration-300 flex items-center gap-2 cursor-pointer ${isCopied ? 'bg-green-600' : 'hover:opacity-90'}`}
							style={!isCopied ? { backgroundColor: '#D97D48' } : undefined}
						>
							{isCopied ? (
								<>
									<Check className="w-4 h-4" />
									<span className="text-sm">Đã sao chép!</span>
								</>
							) : (
								<>
									<Image src={messengerIcon} alt="Messenger" width={22} height={22} />
									<span className="text-sm">Đặt ngay</span>
								</>
							)}
						</button>
					</div>
				</div>
				<p className="text-[9px] text-stone-400 text-center pb-3 flex items-center justify-center gap-0.5">
					<Copy className="w-2.5 h-2.5" />
					Sao chép & dán vào Messenger
				</p>
				</motion.div>
			)}
		</section>
	);
}
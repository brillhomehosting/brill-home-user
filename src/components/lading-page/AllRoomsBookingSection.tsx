'use client';

import messengerIcon from '@/assets/icon-messenger.png';
import { useRooms } from '@/hooks/useRooms';
import { useRoomsAvailability } from '@/hooks/useRoomsAvailability';
import { useRoomsTimeSlots } from '@/hooks/useRoomsTimeSlots';
import { Card, Table } from '@mantine/core';
import { motion } from 'framer-motion';
import { CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

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

	// Use reusable hooks for multiple rooms
	const { data: roomTimeSlotsMap } = useRoomsTimeSlots(rooms);
	const { data: roomAvailabilityMap } = useRoomsAvailability(rooms, startDate, endDate);

	// --- LOGIC: CONSECUTIVE SLOT SELECTION ---

	// 1. Helper to flatten all slots for a specific room into a linear list (sorted by time)
	// Returns array of: { key, price, isActive, date, slotId }
	const getLinearSlots = (roomId: string) => {
		let staticSlots = roomTimeSlotsMap.get(roomId) || [];
		if (!staticSlots.length) return [];

		// Sort slots by time to ensure linear order corresponds to time order
		staticSlots = [...staticSlots].sort((a, b) => {
			const timeA = parseInt(a.startTime.replace(':', ''), 10);
			const timeB = parseInt(b.startTime.replace(':', ''), 10);
			return timeA - timeB;
		});

		const availabilityData = roomAvailabilityMap.get(roomId);
		const linearList: { key: string; price: number; isActive: boolean; date: Date; slotId: string }[] = [];

		dates.forEach(date => {
			const dateStr = formatDate(date);
			const dayData = availabilityData?.find(d => d.date === dateStr);

			staticSlots.forEach(slot => {
				const slotStatus = dayData?.timeSlots?.find(s => s?.timeSlot?.id === slot.id);
				const isActive = slotStatus?.isActive ?? true; // Default to true if no status found (or logic depends on API)

				// Calculate price
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

	const calculateTotal = () => {
		let total = 0;
		selectedSlots.forEach(slotKey => {
			const price = slotPrices.get(slotKey);
			if (price !== undefined) total += price / 1000;
		});
		return total;
	};

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

	const totalPrice = calculateTotal();
	const selectedRoom = rooms?.find(r => r.id === selectedRoomId);

	const buildMessengerMessage = () => {
		if (!selectedRoom || selectedSlots.size === 0) return '';

		const staticSlots = roomTimeSlotsMap.get(selectedRoomId!) || [];

		const slotsInfo = Array.from(selectedSlots).map(slotKey => {
			const parts = slotKey.split('::');
			const [, dateStr, slotId] = parts;
			const date = new Date(dateStr + 'T00:00:00');
			const price = slotPrices.get(slotKey);

			// Find the time slot to get start/end time
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

		let message = `ĐẶT PHÒNG HOMESTAY\n\nPhòng: ${selectedRoom.name}\n\nKhung giờ:\n`;
		Object.entries(groupedByDate).forEach(([date, slots]) => {
			message += `${date}:\n`;
			slots.forEach(slot => {
				message += `  - ${slot.timeRange} (${slot.price})\n`;
			});
		});
		message += `\nTổng: ${totalPrice}k`;
		return message;
	};

	const handleBookNow = async () => {
		if (selectedRoomId && selectedSlots.size > 0) {
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
					<div>
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
						{isLoading ? (
							<LoadingSkeleton />
						) : (
							<div className="max-h-[600px] overflow-auto scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent">
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
											{rooms?.map((room, roomIdx) => {
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
														<div className="py-3 px-2 border-b border-stone-200/60 flex justify-center">
															<span className="text-sm font-bold text-stone-700 block text-center">
																{room.name}
															</span>
														</div>
													</Table.Th>
												);
											})}
										</Table.Tr>

										{/* Row 2: Header Time Slots */}
										<Table.Tr>
											{rooms?.map((room, roomIdx) => {
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
													{rooms?.map((room, roomIdx) => {
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
															const isActive = slotStatus?.isActive ?? true;
															// Calculate dynamic price
															const dynamicPrice = slotStatus?.timeSlot?.price ?? slot.price;

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
																				? 'bg-red-50 text-red-500 border border-transparent cursor-not-allowed shadow-none' // UNAVAILABLE (RED)
																				: isSelected
																					? 'bg-[#D97D48] text-white shadow-lg border border-[#D97D48]' // SELECTED
																					: 'bg-white text-teal-700 border border-teal-200 hover:border-teal-500 hover:shadow-md hover:bg-teal-50' // AVAILABLE
																			}
                                                                        `}
																	>
																		{isActive ? (
																			<span className="leading-none text-[12px] font-bold">
																			</span>
																		) : (
																			<span className="text-[12px] font-bold">Đã đặt</span>
																		)}
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

					{/* Footer: Legend & Action */}
					<div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-6">
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
								<span className="text-xs text-stone-400">Đã đặt</span>
							</div>
						</div>

						{/* Booking Summary Floating Action */}
						{selectedSlots.size > 0 && (
							<motion.div
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
							>
								<Card shadow="lg" radius="md" className="border border-stone-200 w-[350px]" p={0}>
									<div className="flex items-center justify-center gap-4 bg-white p-2 pl-6 pr-2">
										<div className="flex flex-col">
											<span className="text-xs text-stone-500">Tổng cộng</span>
											<span className="font-bold text-lg text-[#D97D48] leading-none">{totalPrice}k</span>
										</div>
										<div className="h-8 w-px bg-stone-200 mx-2"></div>
										<button
											onClick={handleBookNow}
											className="px-6 py-2.5 rounded-md font-medium text-white transition-colors flex items-center gap-2 hover:bg-[#c06b3d] cursor-pointer"
											style={{ backgroundColor: '#D97D48' }}
										>
											<Image src={messengerIcon} alt="Messenger" width={30} height={30} />
											<span>Đặt ngay</span>
										</button>
									</div>
								</Card>
							</motion.div>
						)}
					</div>
				</motion.div>
			</div>
		</section>
	);
}
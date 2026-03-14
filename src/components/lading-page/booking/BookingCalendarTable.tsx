'use client';

import { WEEKDAY_SLOT_DISCOUNT } from '@/constants/pricing';
import { isEligibleForWeeklyDiscount, toKDisplay } from '@/lib/pricingUtils';
import { DayAvailability, Room, TimeSlot } from '@/types/room';
import { Card, Table } from '@mantine/core';
import Image from 'next/image';
import { formatDate, getDayLabel, getTimeSlotIcon, isEndPastSlot, isPastSlot, isToday } from './bookingUtils';
import LoadingSkeleton from './LoadingSkeleton';

interface BookingCalendarTableProps {
	dates: Date[];
	sortedRooms: Room[];
	roomTimeSlotsMap: Map<string, TimeSlot[]>;
	roomAvailabilityMap: Map<string, DayAvailability[]>;
	roomTimeSlotsApiMap: Map<string, TimeSlot[]>;
	selectedSlots: Set<string>;
	onSlotClick: (roomId: string, date: Date, slotId: string, price: number) => void;
	isLoading: boolean;
	isLoadingAvailability: boolean;
}

const TODAY_ROW_BOX_SHADOW = '0 0 18px rgba(154,52,18,0.24), 0 0 30px rgba(251,146,60,0.18)';
const TODAY_SLOT_BOX_SHADOW = '0 6px 12px rgba(15,118,110,0.88), 0 -2px 5px rgba(13,148,136,0.40)';

const isDateBeforeToday = (date: Date) => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const compareDate = new Date(date);
	compareDate.setHours(0, 0, 0, 0);
	return compareDate < today;
};

export default function BookingCalendarTable({
	dates,
	sortedRooms,
	roomTimeSlotsMap,
	roomAvailabilityMap,
	roomTimeSlotsApiMap,
	selectedSlots,
	onSlotClick,
	isLoading,
	isLoadingAvailability,
}: BookingCalendarTableProps) {
	return (
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
													backgroundColor: isTodayRow ? '#FAFAF8' : '#FFFFFF',
													borderRight: '1px solid #E7E5E4',
												}}
											>
												<div className={`
	                                                flex flex-col items-center justify-center py-3 px-2 h-full
	                                                ${isTodayRow ? 'border-l-4 border-l-[#D97D48]' : 'border-l-4 border-l-transparent'}
	                                            `}
													style={isTodayRow ? { boxShadow: TODAY_ROW_BOX_SHADOW } : undefined}
												>
												<span className={`text-xs font-bold uppercase tracking-wide mb-0.5 ${isTodayRow ? 'text-[#D97D48]' : 'text-stone-500'}`} suppressHydrationWarning>
													{isTodayRow ? 'Hôm nay' : getDayLabel(date)}
												</span>
													<span className={`text-sm font-semibold ${isTodayRow ? 'text-[#D97D48]' : 'text-stone-600'}`} suppressHydrationWarning>
														{date.getDate()}/{date.getMonth() + 1}
													</span>
											</div>
										</Table.Td>

										{/* Room Slots */}
										{sortedRooms?.map((room, roomIdx) => {
											const timeSlots = roomTimeSlotsMap.get(room.id) || [];
											const availabilityData = roomAvailabilityMap.get(room.id);
											const cellBg = roomIdx % 2 === 0 ? '#F5F0E8' : '#FFFFFF';

											if (timeSlots.length === 0) {
												return <Table.Td key={room.id} style={{ backgroundColor: cellBg }} />;
											}

											return timeSlots.map((slot) => {
												const slotKey = `${room.id}::${formatDate(date)}::${slot.id}`;
												const isSelected = selectedSlots.has(slotKey);
												const dateStr = formatDate(date);
												const isPastDateRow = isDateBeforeToday(date);
												const isWeeklyDiscount = isEligibleForWeeklyDiscount(dateStr);
												const dayData = availabilityData?.find(d => d.date === dateStr);
												const slotStatus = dayData?.timeSlots?.find(s => s?.timeSlot?.id === slot.id);
												const isApiActive = slotStatus?.isActive ?? true;
												const isStartPast = isPastSlot(date, slot.startTime);
												const isEndPast = isEndPastSlot(date, slot.endTime, slot.isOvernight);
												const isActive = isApiActive && !isEndPast;
												const canInteract = !isPastDateRow && isActive;
												const isBooked = !isApiActive;
												const isPastTimeToday = isStartPast && isApiActive;
												const baseSlotPrice = roomTimeSlotsApiMap.get(room.id)?.find(s => s.id === slot.id)?.price ?? slot.price;
												const dynamicPrice = baseSlotPrice;

												return (
													<Table.Td
														key={slot.id}
														className="text-center p-2 align-middle"
														style={{
															backgroundColor: isTodayRow ? '#FAFAF8' : cellBg,
														}}
													>
														<button
															onClick={() => canInteract && onSlotClick(room.id, date, slot.id, dynamicPrice)}
															disabled={!canInteract}
															className={`
                                                                relative w-full h-[36px] rounded font-medium text-sm transition-all duration-200 flex flex-col items-center justify-center gap-0.5 shadow-sm
																${!canInteract && !isPastDateRow
																	? isBooked
																		? 'bg-red-500 text-white border border-transparent cursor-not-allowed shadow-none'
																		: isPastTimeToday
																			? 'bg-white text-teal-700 border border-teal-200 cursor-not-allowed shadow-none'
																			: 'bg-white text-teal-700 border border-teal-200 cursor-not-allowed shadow-none'
																	: isPastDateRow
																		? isBooked
																			? 'bg-red-500 text-white border border-transparent cursor-not-allowed shadow-none'
																			: 'bg-white text-teal-700 border border-teal-200 cursor-not-allowed shadow-none'
																	: isSelected
																		? 'bg-[#D97D48] text-white shadow-lg border border-[#D97D48]'
																		: isBooked
																			? 'bg-red-500 text-white border border-transparent shadow-none'
																			: 'bg-white text-teal-700 border border-teal-200 hover:border-teal-500 hover:shadow-md'
																}
	                                                            `}
															style={isTodayRow ? {
																boxShadow: TODAY_SLOT_BOX_SHADOW,
															} : undefined}
														>
															{!isPastDateRow && isActive && isWeeklyDiscount && !isSelected ? (
																<span className="rounded-full bg-white/95 px-2 py-[1px] text-[10px] font-bold uppercase tracking-wide text-emerald-700 shadow-sm">
																	-{toKDisplay(WEEKDAY_SLOT_DISCOUNT)}
																</span>
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
	);
}

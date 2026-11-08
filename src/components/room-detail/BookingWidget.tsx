'use client';

import messengerIcon from '@/assets/icon-messenger.png';
import BookingSendModal from '@/components/ui/BookingMessengerModal';
import { useActiveDiscountCampaigns } from '@/hooks/useActiveDiscountCampaigns';
import { useComboDiscounts } from '@/hooks/useComboDiscounts';
import { useHolidaySurchargeByDates } from '@/hooks/useHolidaySurchargeByDates';
import { useSSEAvailability } from '@/hooks/useSSEAvailability';
import { useAvailabilityWindows } from '@/hooks/useAvailabilityWindows';
import { useCalendarVirtualRows } from '@/hooks/useCalendarVirtualRows';
import { useRoomSlotColumns } from '@/hooks/useRoomSlotColumns';
import { CALENDAR_CELL_BORDER_CLASS } from '@/components/lading-page/booking/bookingUtils';
import { parseDateKey } from '@/lib/bookingDates';
import { buildBookingMessage } from '@/lib/buildBookingMessage';
import { calculatePricing, getHolidaySurchargeLabel, getComboDiscountDetail, getSavingsBadgeLabel, toKDisplay } from '@/lib/pricingUtils';
import { applySlotSelection, LinearSelectableSlot, parseSlotKey } from '@/lib/slotSelection';
import { getSlotStatusFromAvailability, useAvailabilityStore } from '@/store/availabilityStore';
import { PricingSelectedSlot } from '@/types/pricing';
import { Room, TimeSlot } from '@/types/room';
import { Card, Table } from '@mantine/core';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useCallback, useMemo, useRef, useState } from 'react';
import BookingWidgetRow from './BookingWidgetRow';
import { useMaxAdvanceBookingDays } from '@/hooks/useMaxAdvanceBookingDays';

const getTimeSlotIcon = (startTime: string, isOvernight: boolean): string => {
	if (isOvernight) return '🌙';
	const hour = parseInt(startTime.split(':')[0] || '12', 10);
	if (hour >= 5 && hour < 17) return '☀️';
	if (hour >= 17 && hour < 21) return '🌆';
	return '🌙';
};

const EMPTY_SELECTION = '';

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
	const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
	const [slotPrices, setSlotPrices] = useState<Map<string, number>>(new Map());
	const [isSendModalOpen, setIsSendModalOpen] = useState(false);
	const [bookingMessage, setBookingMessage] = useState('');

	const { data: maxAdvanceBookingDays = 30 } = useMaxAdvanceBookingDays();
	const availability = useAvailabilityWindows({ roomId: room.id, maxAdvanceDays: Number(maxAdvanceBookingDays) || 30 });

	const roomIds = useMemo(() => [room.id], [room.id]);
	useSSEAvailability(roomIds);

	const roomSlotColumns = useRoomSlotColumns(roomIds, availability.loadedDateKeys);
	const timeSlots = useMemo(() => roomSlotColumns.get(room.id) ?? [], [roomSlotColumns, room.id]);

	const { data: comboDiscounts = [], isLoading: isLoadingComboDiscounts } = useComboDiscounts();
	const {
		data: activeDiscountCampaigns = [],
		isLoading: isLoadingActiveDiscountCampaigns,
	} = useActiveDiscountCampaigns();

	const selectedPricingSlots = useMemo((): PricingSelectedSlot[] => {
		if (selectedSlots.size === 0) return [];

		const slotIndexById = new Map(timeSlots.map((slot, index) => [slot.id, index]));

		return Array.from(selectedSlots)
			.map((slotKey) => {
				const parsed = parseSlotKey(slotKey);
				if (!parsed) return null;
				const slot = timeSlots[slotIndexById.get(parsed.slotId) ?? -1];
				if (!slot) return null;
				return {
					key: slotKey,
					roomId: parsed.roomId,
					date: parsed.date,
					slotId: parsed.slotId,
					startTime: slot.startTime,
					endTime: slot.endTime,
					price: slotPrices.get(slotKey) ?? slot.price,
					isOvernight: slot.isOvernight,
				};
			})
			.filter((slot): slot is PricingSelectedSlot => Boolean(slot))
			.sort((a, b) => a.date.localeCompare(b.date) || (slotIndexById.get(a.slotId) ?? 0) - (slotIndexById.get(b.slotId) ?? 0));
	}, [selectedSlots, slotPrices, timeSlots]);

	const selectedByDate = useMemo(() => {
		const byDate = new Map<string, string>();
		selectedSlots.forEach((slotKey) => {
			const parsed = parseSlotKey(slotKey);
			if (parsed) byDate.set(parsed.date, `${byDate.get(parsed.date) ?? '|'}${parsed.slotId}|`);
		});
		return byDate;
	}, [selectedSlots]);

	const selectedDates = useMemo(
		() => Array.from(new Set(selectedPricingSlots.map((slot) => slot.date))),
		[selectedPricingSlots],
	);
	const { data: holidayByDate, isLoading: isLoadingHolidayByDate } =
		useHolidaySurchargeByDates(selectedDates);
	const isPricingConfigLoading =
		isLoadingComboDiscounts ||
		isLoadingActiveDiscountCampaigns ||
		isLoadingHolidayByDate;

	const pricing = useMemo(
		() => calculatePricing({
			selectedSlots: selectedPricingSlots,
			comboDiscounts,
			activePrograms: activeDiscountCampaigns,
			holidayByDate,
			roomId: room.id,
			roomType: room.roomType,
		}),
		[
			selectedPricingSlots,
			comboDiscounts,
			activeDiscountCampaigns,
			holidayByDate,
			room.id,
			room.roomType,
		],
	);

	const selectionRef = useRef({ selectedSlots, slotPrices });
	selectionRef.current = { selectedSlots, slotPrices };

	const handleSlotClick = useCallback((dateKey: string, slotId: string) => {
		const { selectedSlots: currentSlots, slotPrices: currentPrices } = selectionRef.current;
		const roomDays = useAvailabilityStore.getState().availabilityByRoom[room.id];

		// Selection only reads the clicked day and days already selected.
		const relevantDates = new Set([dateKey]);
		currentSlots.forEach((key) => {
			const parsed = parseSlotKey(key);
			if (parsed) relevantDates.add(parsed.date);
		});

		const linearSlots: LinearSelectableSlot[] = [];
		Array.from(relevantDates).sort().forEach((date) => {
			const day = roomDays?.[date];
			timeSlots.forEach((slot) => {
				const slotWithStatus = day?.timeSlots.find((s) => s.timeSlot.id === slot.id);
				linearSlots.push({
					key: `${room.id}::${date}::${slot.id}`,
					roomId: room.id,
					date,
					slotId: slot.id,
					price: slotWithStatus?.timeSlot?.price ?? slot.price,
					isAvailable: getSlotStatusFromAvailability(slotWithStatus) === 'AVAILABLE',
				});
			});
		});

		const result = applySlotSelection({
			linearSlots,
			selectedSlots: currentSlots,
			clickedKey: `${room.id}::${dateKey}::${slotId}`,
			existingSlotPrices: currentPrices,
		});

		setSelectedSlots(result.selectedSlots);
		setSlotPrices(result.slotPrices);
	}, [room.id, timeSlots]);

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

	const handleBookNow = () => {
		if (selectedSlots.size === 0) return;
		const message = buildMessengerMessage();
		if (!message) return;
		setBookingMessage(message);
		setIsSendModalOpen(true);
	};

	const savingsBadgeLabel = getSavingsBadgeLabel(pricing);
	const comboDetail = getComboDiscountDetail(pricing);
	const holidaySurchargeLabel = getHolidaySurchargeLabel(pricing);

	const isLoading = availability.isLoadingFirst;

	const scrollRef = useRef<HTMLDivElement>(null);
	const headerRef = useRef<HTMLTableSectionElement>(null);
	const dateKeys = availability.loadedDateKeys;
	const currentYear = availability.todayKey.slice(0, 4);
	const columnCount = timeSlots.length + 1;

	const { items, paddingTop, paddingBottom, firstVisibleIndex, scrollToStart } = useCalendarVirtualRows({
		scrollRef,
		headerRef,
		rowCount: dateKeys.length,
		footerRows: 1,
		defaultRowHeight: 48,
		canLoadMore: availability.hasMore && !availability.isFetching && !availability.hasFailed,
		onNearEnd: availability.loadMore,
	});

	const visibleDate = dateKeys[firstVisibleIndex] ? parseDateKey(dateKeys[firstVisibleIndex]!) : null;
	const lastDate = availability.lastDateKey ? parseDateKey(availability.lastDateKey) : null;

	return (
		<Card
			shadow="lg"
			className="overflow-hidden border border-stone-200 bg-white rounded-xl"
			p={0}
		>
			<div className="flex items-center justify-between px-3 py-2 border-b border-stone-200 bg-stone-50">
				<span className="text-xs font-semibold text-stone-700" suppressHydrationWarning>
					{visibleDate ? `Tháng ${visibleDate.getMonth() + 1}/${visibleDate.getFullYear()}` : ''}
				</span>
				{firstVisibleIndex > 7 && (
					<button onClick={scrollToStart} className="text-xs font-semibold text-[#D97D48] cursor-pointer">Về hôm nay</button>
				)}
			</div>

			{isLoading ? (
				<LoadingSkeleton />
			) : availability.hasFailed && dateKeys.length === 0 ? (
				<div className="text-center py-8 text-xs">
					<button onClick={availability.retryFailed} className="font-semibold text-[#D97D48] cursor-pointer">
						Không tải được, bấm để thử lại
					</button>
				</div>
			) : !timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0 ? (
				<div className="text-center py-8 text-stone-400">
					Chưa có khung giờ nào được cấu hình cho phòng này
				</div>
			) : (
				<div ref={scrollRef} className="max-h-[400px] overflow-auto">
					<Table
						withTableBorder
						stickyHeader
						className="min-w-max"
						style={{ borderCollapse: 'separate', borderSpacing: 0 }}
					>
						<Table.Thead ref={headerRef} className="z-40!">
							<Table.Tr>
								<Table.Th
									className={`${CALENDAR_CELL_BORDER_CLASS} sticky left-0 z-30 p-0! min-w-[46px] sm:min-w-[60px]`}
									style={{ backgroundColor: '#FAF9F6', borderRight: '1px solid #E7E5E4' }}
								>
									<div className="flex items-center justify-center h-full w-full py-1.5 sm:py-2 bg-[#FAF9F6]">
										<span className="text-[9px] sm:text-[10px] font-bold text-stone-500 uppercase tracking-wider">
											Ngày
										</span>
									</div>
								</Table.Th>
								{timeSlots.map((slot: TimeSlot) => (
									<Table.Th
										key={slot.id}
										className={`${CALENDAR_CELL_BORDER_CLASS} text-center min-w-[54px] sm:min-w-[70px] p-1 sm:p-1.5`}
										style={{ backgroundColor: '#FAF9F6' }}
									>
										<div className="flex flex-col items-center gap-0.5">
											<span className="text-[8px] sm:text-[10px] font-semibold text-stone-600 leading-tight">
												{slot.startTime}-{slot.endTime}
											</span>
											<span className="text-[9px] sm:text-[10px] opacity-70">
												{getTimeSlotIcon(slot.startTime, slot.isOvernight)} {toKDisplay(slot.price)}
											</span>
										</div>
									</Table.Th>
								))}
							</Table.Tr>
						</Table.Thead>

						<Table.Tbody>
							{paddingTop > 0 && <tr aria-hidden style={{ height: paddingTop }}><td colSpan={columnCount} /></tr>}
							{items.map((item) => {
								const dateKey = dateKeys[item.index];
								if (!dateKey) {
									return (
										<tr key="calendar-footer" data-testid="calendar-footer">
											<td colSpan={columnCount} className="text-center text-[11px] text-stone-500 py-2">
												{availability.hasFailed ? (
													<button onClick={availability.retryFailed} className="font-semibold text-[#D97D48] cursor-pointer">Không tải được, bấm để thử lại</button>
												) : availability.hasMore ? (
													'Đang tải thêm…'
												) : lastDate ? (
													`Đặt xa nhất đến ${lastDate.getDate()}/${lastDate.getMonth() + 1}/${lastDate.getFullYear()}`
												) : null}
											</td>
										</tr>
									);
								}
								return (
									<BookingWidgetRow
										key={dateKey}
										room={room}
										dateKey={dateKey}
										isTodayRow={dateKey === availability.todayKey}
										showYear={!dateKey.startsWith(currentYear)}
										timeSlots={timeSlots}
										selectedSlotIds={selectedByDate.get(dateKey) ?? EMPTY_SELECTION}
										activeDiscountCampaigns={activeDiscountCampaigns}
										onSlotClick={handleSlotClick}
									/>
								);
							})}
							{paddingBottom > 0 && <tr aria-hidden style={{ height: paddingBottom }}><td colSpan={columnCount} /></tr>}
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
					<div className="w-3 h-3 rounded-full bg-red-400"></div>
					<span className="text-[10px] text-stone-600">Đã đặt</span>
				</div>
			</div>

			{selectedSlots.size > 0 && (
				<motion.div
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: 'auto' }}
					className="border-t border-stone-200 p-3"
				>
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
						{isPricingConfigLoading && (
							<div className="px-3 py-1.5 text-[11px] text-stone-500 border-b border-stone-200">
								Đang cập nhật giá tạm tính...
							</div>
						)}

						<div className="px-3 py-1.5 flex justify-between items-center border-t border-stone-200">
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
							// Group discount by program ID → hiển thị từng campaign riêng
							const programGroups = new Map<string, { name: string; amount: number }>();
							pricing.dailyBreakdown.flatMap(day => day.appliedPrograms).forEach(applied => {
								if (applied.discountAmount > 0) {
									const id = applied.program.id;
									const existing = programGroups.get(id);
									if (existing) {
										existing.amount += applied.discountAmount;
									} else {
										programGroups.set(id, {
											name: applied.program.name,
											amount: applied.discountAmount,
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
									{comboDetail
										? `Combo liên tiếp (${comboDetail})`
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
						onClick={handleBookNow}
						className="w-full px-4 py-2.5 rounded-lg font-medium text-white transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer hover:opacity-90"
						style={{ backgroundColor: '#D97D48' }}
					>
						<Image src={messengerIcon} alt="Messenger" width={24} height={24} />
						Đặt phòng ngay
					</button>
					<p className="text-[10px] text-stone-400 text-center mt-1.5">
						Mở popup để copy nội dung và chọn app gửi tin
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

			<BookingSendModal
				opened={isSendModalOpen}
				onClose={() => setIsSendModalOpen(false)}
				bookingMessage={bookingMessage}
			/>
		</Card>
	);
}

'use client';

import { useActiveDiscountCampaigns } from '@/hooks/useActiveDiscountCampaigns';
import { useAvailabilityWindows } from '@/hooks/useAvailabilityWindows';
import { useComboDiscounts } from '@/hooks/useComboDiscounts';
import { useHolidaySurchargeByDates } from '@/hooks/useHolidaySurchargeByDates';
import { useRooms } from '@/hooks/useRooms';
import { useRoomSlotColumns } from '@/hooks/useRoomSlotColumns';
import { useSSEAvailability } from '@/hooks/useSSEAvailability';
import { buildBookingMessage } from '@/lib/buildBookingMessage';
import { calculatePricing } from '@/lib/pricingUtils';
import { applySlotSelection, getSelectionContext, LinearSelectableSlot, parseSlotKey } from '@/lib/slotSelection';
import { getSlotStatusFromAvailability, useAvailabilityStore } from '@/store/availabilityStore';
import { useBookingUIStore } from '@/store/bookingUIStore';
import { PricingSelectedSlot } from '@/types/pricing';
import { motion } from 'framer-motion';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMaxAdvanceBookingDays } from '@/hooks/useMaxAdvanceBookingDays';
import BookingMessengerModal from '../ui/BookingMessengerModal';
import BookingCalendarTable from './booking/BookingCalendarTable';
import BookingInfoBanner from './booking/BookingInfoBanner';
import BookingLegend from './booking/BookingLegend';
import BookingSummaryCard from './booking/BookingSummaryCard';
import BookingTableHeader from './booking/BookingTableHeader';
import MobileBookingBar from './booking/MobileBookingBar';

const MemoBookingInfoBanner = memo(BookingInfoBanner);
const MemoBookingLegend = memo(BookingLegend);

export default function AllRoomsBookingSection() {
	const { data: rooms, isLoading } = useRooms();
	const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
	const [slotPrices, setSlotPrices] = useState<Map<string, number>>(new Map());
	const [isSendModalOpen, setIsSendModalOpen] = useState(false);
	const [bookingMessage, setBookingMessage] = useState('');
	const setMobileBookingBarVisible = useBookingUIStore(s => s.setMobileBookingBarVisible);

	useEffect(() => {
		setMobileBookingBarVisible(selectedSlots.size > 0);
		return () => setMobileBookingBarVisible(false);
	}, [selectedSlots.size, setMobileBookingBarVisible]);

	const { data: maxAdvanceBookingDays = 30 } = useMaxAdvanceBookingDays();
	const allRoomIds = useMemo(() => (rooms || []).map(r => r.id), [rooms]);
	const availability = useAvailabilityWindows({
		roomIds: allRoomIds,
		maxAdvanceDays: Number(maxAdvanceBookingDays) || 30,
	});

	useSSEAvailability(allRoomIds);

	const roomTimeSlotsMap = useRoomSlotColumns(allRoomIds, availability.loadedDateKeys);

	const selectionContext = useMemo(() => getSelectionContext(selectedSlots), [selectedSlots]);
	const selectedRoomId = selectionContext?.roomId ?? null;

	const selectedRoom = useMemo(
		() => rooms?.find((room) => room.id === selectedRoomId) ?? null,
		[rooms, selectedRoomId],
	);

	const { data: comboDiscounts = [], isLoading: isLoadingComboDiscounts } = useComboDiscounts();
	const {
		data: activeDiscountCampaigns = [],
		isLoading: isLoadingActiveDiscountCampaigns,
	} = useActiveDiscountCampaigns();

	const selectedPricingSlots = useMemo((): PricingSelectedSlot[] => {
		if (!selectedRoomId || selectedSlots.size === 0) return [];

		const roomSlots = roomTimeSlotsMap.get(selectedRoomId) || [];
		const slotIndexById = new Map(roomSlots.map((slot, index) => [slot.id, index]));

		return Array.from(selectedSlots)
			.map((slotKey) => {
				const parsed = parseSlotKey(slotKey);
				if (!parsed) return null;
				const slot = roomSlots[slotIndexById.get(parsed.slotId) ?? -1];
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
	}, [selectedRoomId, selectedSlots, slotPrices, roomTimeSlotsMap]);

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
			roomId: selectedRoomId ?? '',
			roomType: selectedRoom?.roomType ?? null,
		}),
		[
			selectedPricingSlots,
			comboDiscounts,
			activeDiscountCampaigns,
			holidayByDate,
			selectedRoomId,
			selectedRoom?.roomType,
		],
	);

	const selectionRef = useRef({ selectedSlots, slotPrices });
	selectionRef.current = { selectedSlots, slotPrices };

	const handleSlotClick = useCallback((roomId: string, dateKey: string, slotId: string) => {
		const { selectedSlots: currentSlots, slotPrices: currentPrices } = selectionRef.current;
		const roomDays = useAvailabilityStore.getState().availabilityByRoom[roomId];
		const roomSlots = roomTimeSlotsMap.get(roomId) || [];

		// Selection only reads the clicked day and days already selected.
		const relevantDates = new Set([dateKey]);
		currentSlots.forEach((key) => {
			const parsed = parseSlotKey(key);
			if (parsed) relevantDates.add(parsed.date);
		});

		const linearSlots: LinearSelectableSlot[] = [];
		Array.from(relevantDates).sort().forEach((date) => {
			const day = roomDays?.[date];
			roomSlots.forEach((slot) => {
				const slotWithStatus = day?.timeSlots.find((s) => s.timeSlot.id === slot.id);
				linearSlots.push({
					key: `${roomId}::${date}::${slot.id}`,
					roomId,
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
			clickedKey: `${roomId}::${dateKey}::${slotId}`,
			existingSlotPrices: currentPrices,
		});

		setSelectedSlots(result.selectedSlots);
		setSlotPrices(result.slotPrices);
	}, [roomTimeSlotsMap]);

	const buildMessengerMessage = () => {
		if (!selectedRoom || selectedPricingSlots.length === 0) return '';

		const groupedByDate: Record<string, { timeRange: string; price: string }[]> = {};
		selectedPricingSlots.forEach(slot => {
			const displayDate = new Date(`${slot.date}T00:00:00`).toLocaleDateString('vi-VN');
			if (!groupedByDate[displayDate]) groupedByDate[displayDate] = [];
			groupedByDate[displayDate]!.push({
				timeRange: `${slot.startTime} - ${slot.endTime}`,
				price: `${Math.round(slot.price / 1000)}k`,
			});
		});

		return buildBookingMessage({
			roomName: selectedRoom.name,
			groupedByDate,
			totalAmount: pricing.totalAmount,
		});
	};

	const handleBookNow = () => {
		if (!selectedRoomId || selectedSlots.size === 0) return;
		const message = buildMessengerMessage();
		if (!message) return;
		setBookingMessage(message);
		setIsSendModalOpen(true);
	};

	const columns = useMemo(() => {
		if (!rooms) return [];
		const earliest = (roomId: string) => {
			const slots = roomTimeSlotsMap.get(roomId) || [];
			return slots.length ? Math.min(...slots.map(s => parseInt(s.startTime.replace(':', ''), 10))) : Infinity;
		};
		return [...rooms]
			.sort((a, b) => earliest(a.id) - earliest(b.id) || a.name.localeCompare(b.name))
			.map((room, index) => ({
				room,
				slots: roomTimeSlotsMap.get(room.id) || [],
				background: index % 2 === 0 ? '#F5F0E8' : '#FFFFFF',
			}));
	}, [rooms, roomTimeSlotsMap]);

	return (
		<section id="booking-table" className="py-12 md:py-20">
			<div className="container mx-auto px-4 max-w-[1400px]">
				<BookingTableHeader />

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ delay: 0.1 }}
				>
					<div className="mb-4">
						<MemoBookingLegend />
					</div>

					<BookingCalendarTable
						dateKeys={availability.loadedDateKeys}
						lastDateKey={availability.lastDateKey}
						todayKey={availability.todayKey}
						columns={columns}
						selectedByDate={selectedByDate}
						onSlotClick={handleSlotClick}
						isLoading={isLoading || availability.isLoadingFirst}
						isFetching={availability.isFetching}
						hasMore={availability.hasMore}
						hasFailed={availability.hasFailed}
						onLoadMore={availability.loadMore}
						onRetry={availability.retryFailed}
						activeDiscountCampaigns={activeDiscountCampaigns}
					/>

					<div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 lg:gap-8 items-start">
						{/* Promo banner on the left */}
						<div className="w-full min-w-0 overflow-hidden">
							<MemoBookingInfoBanner
								comboDiscounts={comboDiscounts}
								isLoading={isLoadingComboDiscounts}
								activeDiscountPrograms={activeDiscountCampaigns}
								isLoadingActiveDiscountPrograms={isLoadingActiveDiscountCampaigns}
							/>
						</div>

						{/* Pricing summary card on the right */}
						<div className="w-full">
							<BookingSummaryCard
								selectedSlots={selectedSlots}
								pricing={pricing}
								isPricingLoading={isPricingConfigLoading}
								onBookNow={handleBookNow}
							/>
						</div>
					</div>

					{selectedSlots.size > 0 && <div className="h-80 md:hidden" />}
				</motion.div>
			</div>

			<MobileBookingBar
				selectedSlots={selectedSlots}
				pricing={pricing}
				isPricingLoading={isPricingConfigLoading}
				onBookNow={handleBookNow}
			/>

			<BookingMessengerModal
				opened={isSendModalOpen}
				onClose={() => setIsSendModalOpen(false)}
				bookingMessage={bookingMessage}
			/>
		</section>
	);
}

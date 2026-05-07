'use client';

import { useActiveDiscountCampaigns } from '@/hooks/useActiveDiscountCampaigns';
import { useComboDiscounts } from '@/hooks/useComboDiscounts';
import { useHolidaySurchargeByDates } from '@/hooks/useHolidaySurchargeByDates';
import { useRooms } from '@/hooks/useRooms';
import { useRoomsAvailability } from '@/hooks/useRoomsAvailability';
import { useRoomsTimeSlots } from '@/hooks/useRoomsTimeSlots';
import { useSSEAvailability } from '@/hooks/useSSEAvailability';
import { buildBookingMessage } from '@/lib/buildBookingMessage';
import { calculatePricing } from '@/lib/pricingUtils';
import { applySlotSelection, getSelectionContext, LinearSelectableSlot, parseSlotKey } from '@/lib/slotSelection';
import { useAvailabilityStore } from '@/store/availabilityStore';
import { useBookingUIStore } from '@/store/bookingUIStore';
import { PricingSelectedSlot } from '@/types/pricing';
import { TimeSlot } from '@/types/room';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import BookingMessengerModal from '../ui/BookingMessengerModal';
import BookingCalendarTable from './booking/BookingCalendarTable';
import BookingInfoBanner from './booking/BookingInfoBanner';
import BookingLegend from './booking/BookingLegend';
import BookingSummaryCard from './booking/BookingSummaryCard';
import BookingTableHeader from './booking/BookingTableHeader';
import MobileBookingBar from './booking/MobileBookingBar';
import { formatDate, generateDates } from './booking/bookingUtils';

type IndexedPricingSlot = PricingSelectedSlot & { index: number };

export default function AllRoomsBookingSection() {
	const { data: rooms, isLoading } = useRooms();
	const [currentDatePage, setCurrentDatePage] = useState(0);
	const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
	const [slotPrices, setSlotPrices] = useState<Map<string, number>>(new Map());
	const [isSendModalOpen, setIsSendModalOpen] = useState(false);
	const [bookingMessage, setBookingMessage] = useState('');
	const setMobileBookingBarVisible = useBookingUIStore(s => s.setMobileBookingBarVisible);

	useEffect(() => {
		setMobileBookingBarVisible(selectedSlots.size > 0);
		return () => setMobileBookingBarVisible(false);
	}, [selectedSlots.size, setMobileBookingBarVisible]);

	const DATES_PER_PAGE = 7;
	const allDates = generateDates(30);
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

	const { data: roomAvailabilityMap, isLoading: isLoadingAvailability } = useRoomsAvailability(startDate, endDate);
	const { data: roomTimeSlotsApiMap } = useRoomsTimeSlots(rooms);

	const allRoomIds = useMemo(() => (rooms || []).map(r => r.id), [rooms]);
	useSSEAvailability(allRoomIds);

	const getSlotStatus = useAvailabilityStore(s => s.getSlotStatus);

	const roomTimeSlotsMap = useMemo(() => {
		const map = new Map<string, TimeSlot[]>();
		if (!rooms) return map;

		rooms.forEach(room => {
			const availabilityData = roomAvailabilityMap.get(room.id);
			if (!availabilityData || availabilityData.length === 0) return;

			const firstDay = availabilityData.find(day => day?.timeSlots?.length);
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

	const getLinearSlots = (roomId: string): LinearSelectableSlot[] => {
		const timeSlots = roomTimeSlotsMap.get(roomId) || [];
		if (!timeSlots.length) return [];

		const availabilityData = roomAvailabilityMap.get(roomId);
		const linearList: LinearSelectableSlot[] = [];

		pagedDates.forEach(date => {
			const dateStr = formatDate(date);
			const dayData = availabilityData?.find(d => d.date === dateStr);

			timeSlots.forEach(slot => {
				const slotStatus = dayData?.timeSlots?.find(s => s?.timeSlot?.id === slot.id);
				const storeStatus = getSlotStatus(roomId, dateStr, slot.id);
				const dynamicPrice = slotStatus?.timeSlot?.price ?? slot.price;

				linearList.push({
					key: `${roomId}::${dateStr}::${slot.id}`,
					roomId,
					date: dateStr,
					slotId: slot.id,
					price: dynamicPrice,
					isAvailable: storeStatus === 'AVAILABLE',
				});
			});
		});

		return linearList;
	};

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

		const linearSlots = getLinearSlots(selectedRoomId);
		const indexByKey = new Map(linearSlots.map((slot, index) => [slot.key, index]));
		const priceByKey = new Map(linearSlots.map((slot) => [slot.key, slot.price]));
		const slotMap = new Map((roomTimeSlotsMap.get(selectedRoomId) || []).map((slot) => [slot.id, slot]));

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
	}, [selectedRoomId, selectedSlots, slotPrices, roomTimeSlotsMap, roomAvailabilityMap, pagedDates]); // eslint-disable-line react-hooks/exhaustive-deps

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

	useEffect(() => {
		setSelectedSlots(new Set());
		setSlotPrices(new Map());
	}, [currentDatePage]);

	const handleSlotClick = (roomId: string, date: Date, slotId: string) => {
		const linearSlots = getLinearSlots(roomId);
		const clickedKey = `${roomId}::${formatDate(date)}::${slotId}`;
		const result = applySlotSelection({
			linearSlots,
			selectedSlots,
			clickedKey,
		});

		setSelectedSlots(result.selectedSlots);
		setSlotPrices(result.slotPrices);
	};

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

	const sortedRooms = useMemo(() => {
		if (!rooms) return [];

		return [...rooms].sort((a, b) => {
			const slotsA = roomTimeSlotsMap.get(a.id) || [];
			const slotsB = roomTimeSlotsMap.get(b.id) || [];

			const getEarliestTime = (slots: typeof slotsA) => {
				if (!slots.length) return Infinity;
				return Math.min(...slots.map(s => parseInt(s.startTime.replace(':', ''), 10)));
			};

			const timeA = getEarliestTime(slotsA);
			const timeB = getEarliestTime(slotsB);

			if (timeA !== timeB) return timeA - timeB;
			return a.name.localeCompare(b.name);
		});
	}, [rooms, roomTimeSlotsMap]);

	return (
		<section id="booking-table" className="py-12 md:py-20">
			<div className="container mx-auto px-4 max-w-[1400px]">
				<BookingTableHeader
					dates={dates}
					currentDatePage={currentDatePage}
					totalPages={totalPages}
					onPrevPage={() => setCurrentDatePage(prev => Math.max(0, prev - 1))}
					onNextPage={() => setCurrentDatePage(prev => Math.min(totalPages - 1, prev + 1))}
				/>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ delay: 0.1 }}
				>
					<div className="mb-4">
						<BookingLegend />
					</div>

					<BookingCalendarTable
						dates={dates}
						sortedRooms={sortedRooms}
						roomTimeSlotsMap={roomTimeSlotsMap}
						roomTimeSlotsApiMap={roomTimeSlotsApiMap}
						selectedSlots={selectedSlots}
						onSlotClick={handleSlotClick}
						isLoading={isLoading}
						isLoadingAvailability={isLoadingAvailability}
						activeDiscountCampaigns={activeDiscountCampaigns}
					/>

					<div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 lg:gap-8 items-start">
						{/* Promo banner on the left */}
						<div className="w-full min-w-0 overflow-hidden">
							<BookingInfoBanner
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


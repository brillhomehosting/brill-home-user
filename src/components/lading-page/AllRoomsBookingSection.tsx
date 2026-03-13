'use client';

import { useRooms } from '@/hooks/useRooms';
import { useRoomsAvailability } from '@/hooks/useRoomsAvailability';
import { useRoomsTimeSlots } from '@/hooks/useRoomsTimeSlots';
import { buildBookingMessage } from '@/lib/buildBookingMessage';
import { calculatePricing, isInDiscountProgram } from '@/lib/pricingUtils';
import { useBookingUIStore } from '@/store/bookingUIStore';
import { TimeSlot } from '@/types/room';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { contactData } from '../../data/contact-data';
import BookingCalendarTable from './booking/BookingCalendarTable';
import BookingInfoBanner from './booking/BookingInfoBanner';
import BookingLegend from './booking/BookingLegend';
import BookingSummaryCard from './booking/BookingSummaryCard';
import BookingTableHeader from './booking/BookingTableHeader';
import MobileBookingBar from './booking/MobileBookingBar';
import { formatDate, generateDates } from './booking/bookingUtils';

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
	const pagedDates = allDates.slice(
		currentDatePage * DATES_PER_PAGE,
		(currentDatePage + 1) * DATES_PER_PAGE
	);
	const shouldShowYesterdayRow = new Date().getHours() < 17;
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	const dates = currentDatePage === 0 && shouldShowYesterdayRow ? [yesterday, ...pagedDates] : pagedDates;

	const startDate = formatDate(dates[0] || new Date());
	const endDate = formatDate(dates[dates.length - 1] || new Date());

	const { data: roomAvailabilityMap, isLoading: isLoadingAvailability } = useRoomsAvailability(rooms, startDate, endDate);
	const { data: roomTimeSlotsApiMap } = useRoomsTimeSlots(rooms);

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

	// Helper to flatten all slots for a specific room into a linear list (sorted by time)
	const getLinearSlots = (roomId: string) => {
		const timeSlots = roomTimeSlotsMap.get(roomId) || [];
		if (!timeSlots.length) return [];

		const availabilityData = roomAvailabilityMap.get(roomId);
		const linearList: { key: string; price: number; isActive: boolean; date: Date; slotId: string }[] = [];

		pagedDates.forEach(date => {
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
		if (selectedRoomId && selectedRoomId !== roomId) {
			const clickedKey = `${roomId}::${formatDate(_date)}::${_slotId}`;
			setSelectedRoomId(roomId);
			setSelectedSlots(new Set([clickedKey]));
			setSlotPrices(new Map([[clickedKey, _price]]));
			return;
		}

		if (!selectedRoomId) {
			setSelectedRoomId(roomId);
		}

		const clickedKey = `${roomId}::${formatDate(_date)}::${_slotId}`;
		const linearSlots = getLinearSlots(roomId);
		const clickedSlotIndex = linearSlots.findIndex(s => s.key === clickedKey);

		if (clickedSlotIndex === -1) return;

		setSelectedSlots(prev => {
			const newSet = new Set(prev);

			if (newSet.has(clickedKey)) {
				const selectedIndices = linearSlots
					.map((s, i) => newSet.has(s.key) ? i : -1)
					.filter(i => i !== -1);

				const minIdx = Math.min(...selectedIndices);
				const maxIdx = Math.max(...selectedIndices);

				if (newSet.size === 1) {
					newSet.clear();
					setSelectedRoomId(null);
					setSlotPrices(new Map());
					return newSet;
				}

				if (clickedSlotIndex === minIdx || clickedSlotIndex === maxIdx) {
					newSet.delete(clickedKey);
					setSlotPrices(prevPrices => {
						const newPrices = new Map(prevPrices);
						newPrices.delete(clickedKey);
						return newPrices;
					});
					return newSet;
				}

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

				if (newSetReset.size === 0) {
					setSelectedRoomId(null);
				}

				return newSetReset;
			}

			if (newSet.size === 0) {
				newSet.add(clickedKey);
				setSlotPrices(new Map([[clickedKey, _price]]));
				return newSet;
			}

			const selectedIndices = linearSlots
				.map((s, i) => newSet.has(s.key) ? i : -1)
				.filter(i => i !== -1);
			const minIdx = Math.min(...selectedIndices);
			const maxIdx = Math.max(...selectedIndices);

			const isAdjacent = clickedSlotIndex === minIdx - 1 || clickedSlotIndex === maxIdx + 1;

			if (isAdjacent) {
				newSet.add(clickedKey);
				setSlotPrices(prev => {
					const newPrices = new Map(prev);
					newPrices.set(clickedKey, _price);
					return newPrices;
				});
			} else {
				newSet.clear();
				newSet.add(clickedKey);
				setSlotPrices(new Map([[clickedKey, _price]]));
			}

			return newSet;
		});
	};

	const selectedRoom = rooms?.find(r => r.id === selectedRoomId);
	const showDiscountBanner = pagedDates.some(d => isInDiscountProgram(formatDate(d)));

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
					<BookingCalendarTable
						dates={dates}
						sortedRooms={sortedRooms}
						roomTimeSlotsMap={roomTimeSlotsMap}
						roomAvailabilityMap={roomAvailabilityMap}
						roomTimeSlotsApiMap={roomTimeSlotsApiMap}
						selectedSlots={selectedSlots}
						onSlotClick={handleSlotClick}
						isLoading={isLoading}
						isLoadingAvailability={isLoadingAvailability}
					/>

					<BookingInfoBanner showDiscountBanner={showDiscountBanner} />

					<div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-6">
						<BookingLegend />
						<BookingSummaryCard
							selectedSlots={selectedSlots}
							pricing={pricing}
							isCopied={isCopied}
							onBookNow={handleBookNow}
						/>
					</div>

					{selectedSlots.size > 0 && <div className="h-80 md:hidden" />}
				</motion.div>
			</div>

			<MobileBookingBar
				selectedSlots={selectedSlots}
				pricing={pricing}
				isCopied={isCopied}
				onBookNow={handleBookNow}
			/>
		</section>
	);
}

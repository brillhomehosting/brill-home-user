// 'use client';

// import { roomsApi } from '@/api/roomApiService';
// import zaloIcon from '@/assets/icon-zalo.png';
// import { useRooms } from '@/hooks/useRooms';
// import { DayAvailability, TimeSlot } from '@/types/room';
// import { useQueries } from '@tanstack/react-query';
// import { AnimatePresence, motion } from 'framer-motion';
// import { ChevronLeft, ChevronRight } from 'lucide-react';
// import Image from 'next/image';
// import { useEffect, useMemo, useState } from 'react';

// // --- UTILS (Giữ nguyên logic cũ, chỉ clean code) ---
// const generateDates = (count: number) => {
// 	return Array.from({ length: count }, (_, i) => {
// 		const date = new Date();
// 		date.setDate(date.getDate() + i);
// 		return date;
// 	});
// };

// const getDayLabel = (date: Date) => {
// 	const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
// 	return days[date.getDay()];
// };

// const formatDate = (date: Date): string => {
// 	const year = date.getFullYear();
// 	const month = String(date.getMonth() + 1).padStart(2, '0');
// 	const day = String(date.getDate()).padStart(2, '0');
// 	return `${year}-${month}-${day}`;
// };

// const isToday = (date: Date) => date.toDateString() === new Date().toDateString();

// // --- COMPONENTS ---

// // 1. Time Slot Button: Tách riêng để dễ quản lý state active/disable
// const TimeSlotButton = ({
// 	slot,
// 	isActive,
// 	isSelected,
// 	onClick
// }: {
// 	slot: TimeSlot,
// 	isActive: boolean,
// 	isSelected: boolean,
// 	onClick: () => void
// }) => {
// 	const priceInK = slot.price / 1000;

// 	return (
// 		<button
// 			onClick={onClick}
// 			disabled={!isActive}
// 			className={`
//                 relative flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all duration-200 w-full
//                 ${!isActive
// 					? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
// 					: isSelected
// 						? 'bg-orange-50 border-orange-500 text-orange-600 shadow-sm ring-1 ring-orange-500'
// 						: 'bg-white border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50/50'
// 				}
//             `}
// 		>
// 			<span className="text-xs font-medium mb-1">{slot.startTime} - {slot.endTime}</span>
// 			{isActive ? (
// 				<span className={`text-sm font-bold ${isSelected ? 'text-orange-600' : 'text-gray-900'}`}>
// 					{priceInK}k
// 				</span>
// 			) : (
// 				<span className="text-xs">Đã đặt</span>
// 			)}

// 			{/* UX Micro-interaction: Checkmark visual */}
// 			{isSelected && (
// 				<div className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
// 			)}
// 		</button>
// 	);
// };

// export default function AllRoomsBookingSection() {
// 	const { data: rooms, isLoading } = useRooms();
// 	const [currentDatePage, setCurrentDatePage] = useState(0);
// 	const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
// 	// UX Improvement: Default chọn phòng đầu tiên khi load xong
// 	const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
// 	const [slotPrices, setSlotPrices] = useState<Map<string, number>>(new Map());

// 	useEffect(() => {
// 		if (rooms && rooms.length > 0 && !activeRoomId) {
// 			setActiveRoomId(rooms[0]?.id || null);
// 		}
// 	}, [rooms, activeRoomId]);

// 	const DATES_PER_PAGE = 5; // Mobile: Show ít ngày hơn để đỡ rối
// 	const allDates = generateDates(30);
// 	const totalPages = Math.ceil(allDates.length / DATES_PER_PAGE);
// 	const dates = allDates.slice(
// 		currentDatePage * DATES_PER_PAGE,
// 		(currentDatePage + 1) * DATES_PER_PAGE
// 	);

// 	const startDate = formatDate(dates[0] || new Date());
// 	const endDate = formatDate(dates[dates.length - 1] || new Date());

// 	// --- DATA FETCHING (Logic giữ nguyên) ---
// 	const timeSlotsQueries = useQueries({
// 		queries: (rooms || []).map((room) => ({
// 			queryKey: ['roomTimeSlots', room.id],
// 			queryFn: async () => {
// 				const response = await roomsApi.fetchRoomTimeSlots(room.id);
// 				return { roomId: room.id, data: response.success ? response.data : [] };
// 			},
// 			enabled: !!room.id,
// 			staleTime: Infinity,
// 		})),
// 	});

// 	const availabilityQueries = useQueries({
// 		queries: (rooms || []).map((room) => ({
// 			queryKey: ['timeSlotAvailability', room.id, startDate, endDate],
// 			queryFn: async () => {
// 				const response = await roomsApi.fetchTimeSlotAvailability(room.id, startDate, endDate);
// 				return { roomId: room.id, data: response.success ? response.data : [] };
// 			},
// 			enabled: !!room.id && !!startDate && !!endDate,
// 			staleTime: 1000 * 60 * 5,
// 		})),
// 	});

// 	// Helpers
// 	const getRoomData = (roomId: string | null) => {
// 		if (!roomId) return { slots: [], availability: [] };
// 		const slots = timeSlotsQueries.find(q => q.data?.roomId === roomId)?.data?.data || [];
// 		const availability = availabilityQueries.find(q => q.data?.roomId === roomId)?.data?.data || [];
// 		return { slots, availability };
// 	};

// 	const isSlotAvailable = (availability: DayAvailability[], date: Date, slotId: string) => {
// 		const dateStr = formatDate(date);
// 		const dayData = availability.find(d => d.date === dateStr);
// 		if (!dayData) return true;
// 		return dayData.timeSlots.find(s => s.timeSlot.id === slotId)?.isActive ?? true;
// 	};

// 	// Handle Click (Logic đã tối ưu lại)
// 	const handleSlotClick = (roomId: string, date: Date, slotId: string, price: number) => {
// 		const slotKey = `${roomId}::${formatDate(date)}::${slotId}`;

// 		setSelectedSlots(prev => {
// 			const newSet = new Set(prev);

// 			// Nếu click vào slot của phòng khác phòng đang chọn (trường hợp hiếm vì UI đã chia tab), clear hết
// 			const currentRoomIdInSelection = Array.from(prev)[0]?.split('::')[0];
// 			if (currentRoomIdInSelection && currentRoomIdInSelection !== roomId) {
// 				newSet.clear();
// 				setSlotPrices(new Map());
// 			}

// 			if (newSet.has(slotKey)) {
// 				newSet.delete(slotKey);
// 				setSlotPrices(p => { const m = new Map(p); m.delete(slotKey); return m; });
// 			} else {
// 				newSet.add(slotKey);
// 				setSlotPrices(p => { const m = new Map(p); m.set(slotKey, price); return m; });
// 			}
// 			return newSet;
// 		});
// 	};

// 	const totalPrice = useMemo(() => {
// 		let total = 0;
// 		selectedSlots.forEach(key => {
// 			const price = slotPrices.get(key);
// 			if (price) total += price / 1000;
// 		});
// 		return total;
// 	}, [selectedSlots, slotPrices]);

// 	const buildZaloMessage = () => {
// 		const activeRoom = rooms?.find(r => r.id === activeRoomId);
// 		if (!activeRoom || selectedSlots.size === 0) return '';

// 		// ... (Giữ nguyên logic tạo message của bạn) ...
// 		// Để ngắn gọn cho demo này tôi viết tắt
// 		return `Đặt phòng ${activeRoom.name}. Tổng tiền: ${totalPrice}k`;
// 	};

// 	const handleBookNow = async () => {
// 		const message = buildZaloMessage();
// 		try {
// 			await navigator.clipboard.writeText(message);
// 			alert('Đã copy nội dung! Đang mở Zalo...');
// 			window.open(`https://zalo.me/0939293804`, '_blank');
// 		} catch {
// 			prompt('Copy tin nhắn:', message);
// 		}
// 	};

// 	const { slots: activeTimeSlots, availability: activeAvailability } = getRoomData(activeRoomId);

// 	if (isLoading) return <div className="py-20 text-center">Đang tải dữ liệu phòng...</div>;

// 	return (
// 		<section className="bg-white min-h-screen pb-32 pt-6"> {/* Padding bottom lớn để tránh che mất Sticky Footer */}
// 			<div className="container mx-auto px-4 max-w-7xl"> {/* Giới hạn width trên desktop giống mobile app */}

// 				{/* 1. Header & Date Pagination */}
// 				<div className="flex items-center justify-between mb-6">
// 					<div>
// 						<h2 className="text-2xl font-serif font-bold text-gray-900">Đặt lịch</h2>
// 						<p className="text-sm text-gray-500">Chọn phòng và giờ phù hợp</p>
// 					</div>
// 					<div className="flex gap-2">
// 						<button
// 							onClick={() => setCurrentDatePage(p => Math.max(0, p - 1))}
// 							disabled={currentDatePage === 0}
// 							className="p-2 rounded-full border hover:bg-gray-50 disabled:opacity-30"
// 						>
// 							<ChevronLeft className="w-5 h-5" />
// 						</button>
// 						<button
// 							onClick={() => setCurrentDatePage(p => Math.min(totalPages - 1, p + 1))}
// 							disabled={currentDatePage >= totalPages - 1}
// 							className="p-2 rounded-full border hover:bg-gray-50 disabled:opacity-30"
// 						>
// 							<ChevronRight className="w-5 h-5" />
// 						</button>
// 					</div>
// 				</div>

// 				{/* 2. Room Tabs (Sticky Horizontal Scroll) */}
// 				<div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm pt-2 pb-4 border-b mb-6 overflow-x-auto no-scrollbar">
// 					<div className="flex gap-3 min-w-max px-1">
// 						{rooms?.map(room => {
// 							const isActive = activeRoomId === room.id;
// 							return (
// 								<button
// 									key={room.id}
// 									onClick={() => {
// 										setActiveRoomId(room.id);
// 										// Reset selection khi đổi phòng (optional UX choice)
// 										setSelectedSlots(new Set());
// 										setSlotPrices(new Map());
// 									}}
// 									className={`
//                                         px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap
//                                         ${isActive
// 											? 'bg-gray-900 text-white shadow-md transform scale-105'
// 											: 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
//                                     `}
// 								>
// 									{room.name}
// 								</button>
// 							)
// 						})}
// 					</div>
// 				</div>

// 				{/* 3. Calendar List (Feed View) */}
// 				<div className="space-y-6">
// 					<AnimatePresence mode='wait'>
// 						<motion.div
// 							key={activeRoomId || '' + currentDatePage} // Re-render animation khi đổi phòng hoặc đổi trang
// 							initial={{ opacity: 0, y: 10 }}
// 							animate={{ opacity: 1, y: 0 }}
// 							exit={{ opacity: 0, y: -10 }}
// 							transition={{ duration: 0.2 }}
// 						>
// 							{dates.map((date, idx) => (
// 								<div key={idx} className="bg-white rounded-none md:rounded-2xl mb-8">
// 									{/* Date Header */}
// 									<div className="flex items-center gap-3 mb-4">
// 										<div className={`
//                                             w-12 h-12 flex flex-col items-center justify-center rounded-xl border
//                                             ${isToday(date) ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-gray-50 border-gray-100 text-gray-600'}
//                                         `}>
// 											<span className="text-xs font-medium uppercase">...</span>
// 											<span className="text-lg font-bold leading-none">{date.getDate()}</span>
// 										</div>
// 										<div>
// 											<h3 className={`font-semibold ${isToday(date) ? 'text-orange-600' : 'text-gray-900'}`}>
// 												{isToday(date) ? 'Hôm nay' : getDayLabel(date)}
// 											</h3>
// 											<p className="text-xs text-gray-500">Tháng {date.getMonth() + 1}</p>
// 										</div>
// 									</div>

// 									{/* Time Slots Grid */}
// 									{activeTimeSlots.length > 0 ? (
// 										<div className="grid grid-cols-3 gap-3">
// 											{activeTimeSlots.map(slot => {
// 												const isActive = isSlotAvailable(activeAvailability, date, slot.id);
// 												const slotKey = `${activeRoomId}::${formatDate(date)}::${slot.id}`;
// 												const isSelected = selectedSlots.has(slotKey);

// 												return (
// 													<TimeSlotButton
// 														key={slot.id}
// 														slot={slot}
// 														isActive={isActive}
// 														isSelected={isSelected}
// 														onClick={() => handleSlotClick(activeRoomId!, date, slot.id, slot.price)}
// 													/>
// 												);
// 											})}
// 										</div>
// 									) : (
// 										<div className="p-4 bg-gray-50 rounded-xl text-center text-sm text-gray-400">
// 											Chưa có lịch cho phòng này
// 										</div>
// 									)}
// 								</div>
// 							))}
// 						</motion.div>
// 					</AnimatePresence>
// 				</div>

// 				{/* 4. Sticky Booking Footer (Mobile First Essential) */}
// 				<AnimatePresence>
// 					{selectedSlots.size > 0 && (
// 						<motion.div
// 							initial={{ y: 100 }}
// 							animate={{ y: 0 }}
// 							exit={{ y: 100 }}
// 							className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-50"
// 						>
// 							<div className="container mx-auto max-w-xl flex items-center justify-between gap-4">
// 								<div>
// 									<div className="text-xs text-gray-500 mb-0.5">
// 										Đã chọn <span className="font-bold text-gray-900">{selectedSlots.size}</span> khung giờ
// 									</div>
// 									<div className="text-2xl font-bold text-gray-900 leading-none">
// 										{totalPrice}k
// 									</div>
// 								</div>
// 								<button
// 									onClick={handleBookNow}
// 									className="flex-1 bg-[#D97D48] hover:bg-[#c56d3b] text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-orange-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
// 								>
// 									<Image src={zaloIcon} alt="Zalo" width={24} height={24} className="rounded" />
// 									<span>Đặt phòng ngay</span>
// 								</button>
// 							</div>
// 						</motion.div>
// 					)}
// 				</AnimatePresence>
// 			</div>
// 		</section>
// 	);
// }
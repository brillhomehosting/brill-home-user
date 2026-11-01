'use client';

import { useCalendarVirtualRows } from '@/hooks/useCalendarVirtualRows';
import { parseDateKey } from '@/lib/bookingDates';
import { toKDisplay } from '@/lib/pricingUtils';
import { ActiveDiscountProgram } from '@/types/pricing';
import { Card, Table } from '@mantine/core';
import Image from 'next/image';
import { memo, useRef } from 'react';
import BookingCalendarRow, { RoomColumn } from './BookingCalendarRow';
import { CALENDAR_CELL_BORDER_CLASS, getTimeSlotIcon } from './bookingUtils';
import LoadingSkeleton from './LoadingSkeleton';

interface BookingCalendarTableProps {
	dateKeys: string[];
	lastDateKey: string | undefined;
	todayKey: string;
	columns: RoomColumn[];
	selectedByDate: Map<string, string>;
	onSlotClick: (roomId: string, dateKey: string, slotId: string) => void;
	isLoading: boolean;
	isFetching: boolean;
	hasMore: boolean;
	hasFailed: boolean;
	onLoadMore: () => void;
	onRetry: () => void;
	activeDiscountCampaigns?: ActiveDiscountProgram[];
}

const EMPTY_SELECTION = '';
const NO_CAMPAIGNS: ActiveDiscountProgram[] = [];
const BACK_TO_TODAY_MIN_ROW = 7;

const CalendarHeader = memo(function CalendarHeader({ columns }: { columns: RoomColumn[] }) {
	return (
		<>
			<Table.Tr>
				<Table.Th
					rowSpan={2}
					className={`${CALENDAR_CELL_BORDER_CLASS} sticky left-0 z-30 p-0! min-w-[54px] sm:min-w-[80px]`}
					style={{ backgroundColor: '#FAF9F6', borderRight: '1px solid #E7E5E4' }}
				>
					<div className="flex items-center justify-center h-full w-full py-2 sm:py-4 bg-[#FAF9F6]">
						<span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-stone-500 uppercase tracking-widest">
							Ngày
						</span>
					</div>
				</Table.Th>
				{columns.map(({ room, slots, background }) => (
					<Table.Th
						key={room.id}
						colSpan={slots.length || 1}
						className={`${CALENDAR_CELL_BORDER_CLASS} text-center p-0!`}
						style={{ backgroundColor: background }}
					>
						<div className="relative h-20 sm:h-32 w-full border-b border-stone-200 overflow-hidden group">
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
								<span className="text-white font-bold text-base md:text-lg text-center drop-shadow-md px-2 py-1 bg-black/20 rounded">
									{room.name}
								</span>
							</div>
						</div>
					</Table.Th>
				))}
			</Table.Tr>

			<Table.Tr>
				{columns.map(({ room, slots, background }) => {
					if (slots.length === 0) {
						return (
							<Table.Th key={room.id} className={`${CALENDAR_CELL_BORDER_CLASS} text-center`} style={{ backgroundColor: background }}>
								<span className="text-xs text-stone-400 font-normal italic">Trống</span>
							</Table.Th>
						);
					}
					return slots.map((slot) => (
						<Table.Th
							key={slot.id}
							className={`${CALENDAR_CELL_BORDER_CLASS} text-center min-w-[60px] sm:min-w-[90px] p-1 sm:p-2`}
							style={{ backgroundColor: background }}
						>
							<div className="flex flex-col items-center gap-0.5 sm:gap-1">
								<span className="text-[9px] sm:text-xs font-semibold text-stone-600 bg-white/50 px-1 sm:px-1.5 py-0.5 rounded leading-tight">
									{slot.startTime}-{slot.endTime}
								</span>
								<span className="text-[9px] sm:text-[10px] opacity-70">
									{getTimeSlotIcon(slot.startTime, slot.isOvernight)} {toKDisplay(slot.price)}
								</span>
							</div>
						</Table.Th>
					));
				})}
			</Table.Tr>
		</>
	);
});

const formatMonth = (dateKey: string | undefined): string => {
	if (!dateKey) return '';
	const date = parseDateKey(dateKey);
	return `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;
};

const formatFullDate = (dateKey: string | undefined): string => {
	if (!dateKey) return '';
	const date = parseDateKey(dateKey);
	return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

export default function BookingCalendarTable({
	dateKeys,
	lastDateKey,
	todayKey,
	columns,
	selectedByDate,
	onSlotClick,
	isLoading,
	isFetching,
	hasMore,
	hasFailed,
	onLoadMore,
	onRetry,
	activeDiscountCampaigns = NO_CAMPAIGNS,
}: BookingCalendarTableProps) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const headerRef = useRef<HTMLTableSectionElement>(null);
	const columnCount = 1 + columns.reduce((total, column) => total + (column.slots.length || 1), 0);
	const currentYear = todayKey.slice(0, 4);

	const { items, paddingTop, paddingBottom, firstVisibleIndex, scrollToStart } = useCalendarVirtualRows({
		scrollRef,
		headerRef,
		rowCount: dateKeys.length,
		footerRows: 1,
		defaultRowHeight: 64,
		canLoadMore: hasMore && !isFetching && !hasFailed,
		onNearEnd: onLoadMore,
	});

	return (
		<Card shadow="sm" radius="md" className="bg-white border border-stone-200 overflow-hidden p-0!">
			{isLoading ? (
				<LoadingSkeleton />
			) : (
				<>
					<div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-stone-200 bg-stone-50">
						<span className="text-xs sm:text-sm font-semibold text-stone-700" data-testid="visible-month" suppressHydrationWarning>
							{formatMonth(dateKeys[firstVisibleIndex])}
						</span>
						<div className="flex items-center gap-3 text-xs font-semibold text-[#D97D48]">
							{firstVisibleIndex > BACK_TO_TODAY_MIN_ROW && (
								<button onClick={scrollToStart} className="cursor-pointer hover:underline">
									Về hôm nay
								</button>
							)}
							<button
								onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })}
								className="cursor-pointer hover:underline"
							>
								Xem các phòng
							</button>
						</div>
					</div>

					<div
						ref={scrollRef}
						className="max-h-[min(650px,62dvh)] overflow-auto scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent"
					>
						{/* Fixed layout stops every inserted row from re-measuring all columns while scrolling. */}
						<Table
							withTableBorder
							stickyHeader
							layout="fixed"
							className="[--date-col:54px] sm:[--date-col:80px] [--slot-col:80px] sm:[--slot-col:104px]"
							style={{
								minWidth: `calc(var(--date-col) + ${columnCount - 1} * var(--slot-col))`,
								borderCollapse: 'separate',
								borderSpacing: 0,
							}}
						>
							<colgroup>
								<col style={{ width: 'var(--date-col)' }} />
								{Array.from({ length: columnCount - 1 }, (_, index) => (
									<col key={index} style={{ width: 'var(--slot-col)' }} />
								))}
							</colgroup>
							<Table.Thead ref={headerRef} className="z-40!">
								<CalendarHeader columns={columns} />
							</Table.Thead>

							<Table.Tbody>
								{paddingTop > 0 && (
									<tr aria-hidden style={{ height: paddingTop }}>
										<td colSpan={columnCount} />
									</tr>
								)}
								{items.map((item) => {
									const dateKey = dateKeys[item.index];
									if (!dateKey) {
										return (
											<tr key="calendar-footer" data-testid="calendar-footer">
												<td colSpan={columnCount} className="py-3 text-xs text-stone-500">
													<div className="sticky left-3 w-max">
														{hasFailed ? (
															<button onClick={onRetry} className="font-semibold text-[#D97D48] cursor-pointer">
																Không tải được, bấm để thử lại
															</button>
														) : hasMore ? (
															'Đang tải thêm…'
														) : (
															`Đặt xa nhất đến ${formatFullDate(lastDateKey)}`
														)}
													</div>
												</td>
											</tr>
										);
									}
									return (
										<BookingCalendarRow
											key={dateKey}
											dateKey={dateKey}
											isTodayRow={dateKey === todayKey}
											showYear={!dateKey.startsWith(currentYear)}
											columns={columns}
											selectedSlotIds={selectedByDate.get(dateKey) ?? EMPTY_SELECTION}
											activeDiscountCampaigns={activeDiscountCampaigns}
											onSlotClick={onSlotClick}
										/>
									);
								})}
								{paddingBottom > 0 && (
									<tr aria-hidden style={{ height: paddingBottom }}>
										<td colSpan={columnCount} />
									</tr>
								)}
							</Table.Tbody>
						</Table>
					</div>
				</>
			)}
		</Card>
	);
}

'use client';

import { getCampaignDiscountBadge, resolveBestProgramForSlot, toKDisplay, toPercentValue } from '@/lib/pricingUtils';
import { parseDateKey } from '@/lib/bookingDates';
import { getSlotStatusFromAvailability, useAvailabilityStore } from '@/store/availabilityStore';
import { ActiveDiscountProgram, PricingSelectedSlot } from '@/types/pricing';
import { Room, TimeSlot } from '@/types/room';
import type { SlotStatus } from '@/types/timeslot';
import { memo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { CALENDAR_CELL_BORDER_CLASS, getDayLabel } from './bookingUtils';

const TODAY_ROW_BOX_SHADOW = '0 0 18px rgba(154,52,18,0.24), 0 0 30px rgba(251,146,60,0.18)';
const TODAY_SLOT_BOX_SHADOW = '0 6px 12px rgba(15,118,110,0.88), 0 -2px 5px rgba(13,148,136,0.40)';

export interface RoomColumn {
	room: Room;
	slots: TimeSlot[];
	background: string;
}

interface BookingCalendarRowProps {
	dateKey: string;
	isTodayRow: boolean;
	showYear: boolean;
	columns: RoomColumn[];
	selectedSlotIds: string;
	activeDiscountCampaigns: ActiveDiscountProgram[];
	onSlotClick: (roomId: string, dateKey: string, slotId: string) => void;
}

function getSlotClasses(status: SlotStatus | undefined, isSelected: boolean, canInteract: boolean, isTodayRow: boolean): {
	className: string;
	style?: React.CSSProperties;
} {
	if (isSelected) {
		return {
			className: 'bg-[#D97D48] text-white shadow-lg border border-[#D97D48]',
			style: isTodayRow ? { boxShadow: TODAY_SLOT_BOX_SHADOW } : undefined,
		};
	}

	switch (status) {
		case 'BOOKED':
			return {
				className: 'bg-[#CF5B51] text-white border border-transparent cursor-not-allowed shadow-none',
			};
		case 'AVAILABLE':
		default:
			return {
				className: canInteract && status === 'AVAILABLE'
					? 'bg-white text-teal-700 border border-teal-200 hover:border-teal-500 hover:shadow-md'
					: 'bg-white text-teal-700 border border-teal-200 cursor-not-allowed shadow-none',
				style: isTodayRow ? { boxShadow: TODAY_SLOT_BOX_SHADOW } : undefined,
			};
	}
}

function resolveSlotBadge(
	room: Room,
	dateKey: string,
	slot: TimeSlot,
	campaigns: ActiveDiscountProgram[],
): string | null {
	if (campaigns.length === 0) return null;
	const singleSlot: PricingSelectedSlot = {
		key: 'temp',
		roomId: room.id,
		date: dateKey,
		slotId: slot.id,
		price: slot.price,
		isOvernight: slot.isOvernight,
		startTime: '00:00',
		endTime: '00:00',
	};
	const best = resolveBestProgramForSlot(singleSlot, dateKey, room.id, room.roomType, campaigns, slot.price);
	if (!best?.program) return null;
	return best.program.discountType === 'PERCENTAGE'
		? `-${Math.round(toPercentValue(best.program.discountValue))}%`
		: `-${toKDisplay(best.program.discountValue)}`;
}

function BookingCalendarRow({
	dateKey,
	isTodayRow,
	showYear,
	columns,
	selectedSlotIds,
	activeDiscountCampaigns,
	onSlotClick,
}: BookingCalendarRowProps) {
	const days = useAvailabilityStore(
		useShallow((state) => columns.map((column) => state.availabilityByRoom[column.room.id]?.[dateKey])),
	);
	const date = parseDateKey(dateKey);
	// Most far-future days have no campaign, so filter once per row instead of per cell.
	const campaignsOnDate = activeDiscountCampaigns.filter(
		(campaign) => dateKey >= campaign.startDate && dateKey <= campaign.endDate,
	);

	return (
		<tr data-date={dateKey} className="h-[39px] sm:h-[64px]">
			<td
				className={`${CALENDAR_CELL_BORDER_CLASS} sticky left-0 z-20 p-0!`}
				style={{
					backgroundColor: isTodayRow ? '#FAFAF8' : '#FFFFFF',
					borderRight: '1px solid #E7E5E4',
				}}
			>
				<div
					className={`flex flex-col items-center justify-center py-1 px-1 sm:py-3 sm:px-2 h-full ${isTodayRow ? 'border-l-2 sm:border-l-4 border-l-[#D97D48]' : 'border-l-2 sm:border-l-4 border-l-transparent'}`}
					style={isTodayRow ? { boxShadow: TODAY_ROW_BOX_SHADOW } : undefined}
				>
					<span className={`text-[9px] sm:text-xs font-bold uppercase tracking-wide mb-0 sm:mb-0.5 ${isTodayRow ? 'text-[#D97D48]' : 'text-stone-500'}`} suppressHydrationWarning>
						{isTodayRow ? 'Nay' : getDayLabel(date)}
					</span>
					<span className={`text-[10px] sm:text-sm font-semibold ${isTodayRow ? 'text-[#D97D48]' : 'text-stone-600'}`} suppressHydrationWarning>
						{date.getDate()}/{date.getMonth() + 1}{showYear ? `/${String(date.getFullYear()).slice(2)}` : ''}
					</span>
				</div>
			</td>

			{columns.map((column, columnIndex) => {
				if (column.slots.length === 0) {
					return <td key={column.room.id} className={`${CALENDAR_CELL_BORDER_CLASS} p-2`} style={{ backgroundColor: column.background }} />;
				}
				const day = days[columnIndex];
				return column.slots.map((slot) => {
					const slotWithStatus = day?.timeSlots.find((s) => s.timeSlot.id === slot.id);
					const slotStatus = getSlotStatusFromAvailability(slotWithStatus);
					const isSelected = selectedSlotIds.includes(`|${slot.id}|`);
					const canInteract = slotStatus === 'AVAILABLE';
					const badgeText = canInteract
						? getCampaignDiscountBadge(slotWithStatus?.discountType, slotWithStatus?.discountValue)
							?? resolveSlotBadge(column.room, dateKey, slot, campaignsOnDate)
						: null;
					const { className: slotClasses, style: slotStyle } = getSlotClasses(slotStatus, isSelected, canInteract, isTodayRow);

					return (
						<td
							key={slot.id}
							className={`${CALENDAR_CELL_BORDER_CLASS} text-center p-0.5 sm:p-2 align-middle`}
							style={{ backgroundColor: isTodayRow ? '#FAFAF8' : column.background }}
						>
							<button
								onClick={() => canInteract && onSlotClick(column.room.id, dateKey, slot.id)}
								disabled={!canInteract}
								className={`relative w-full h-[24px] sm:h-[36px] rounded font-medium text-xs sm:text-sm transition-colors duration-200 flex flex-col items-center justify-center shadow-sm ${slotClasses}`}
								style={slotStyle}
							>
								{badgeText && (
									<div className={`absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 px-1 py-0.5 rounded shadow-sm z-10 whitespace-nowrap text-[6px] sm:text-[7px] font-bold ${isSelected ? 'bg-white text-[#D97D48]' : 'bg-[#046B5A] text-white'}`}>
										{badgeText}
									</div>
								)}
							</button>
						</td>
					);
				});
			})}
		</tr>
	);
}

export default memo(BookingCalendarRow);

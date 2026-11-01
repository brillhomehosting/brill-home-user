'use client';

import { parseDateKey } from '@/lib/bookingDates';
import { getCampaignDiscountBadge, resolveBestProgramForSlot, toKDisplay, toPercentValue } from '@/lib/pricingUtils';
import { getSlotStatusFromAvailability, useAvailabilityStore } from '@/store/availabilityStore';
import { ActiveDiscountProgram, PricingSelectedSlot } from '@/types/pricing';
import { Room, TimeSlot } from '@/types/room';
import { memo } from 'react';
import { CALENDAR_CELL_BORDER_CLASS, getDayLabel } from '@/components/lading-page/booking/bookingUtils';

const TODAY_ROW_BOX_SHADOW = '0 0 18px rgba(154,52,18,0.24), 0 0 30px rgba(251,146,60,0.18)';
const TODAY_SLOT_BOX_SHADOW = '0 6px 12px rgba(15,118,110,0.88), 0 -2px 5px rgba(13,148,136,0.40)';

interface BookingWidgetRowProps {
	room: Room;
	dateKey: string;
	isTodayRow: boolean;
	showYear: boolean;
	timeSlots: TimeSlot[];
	selectedSlotIds: string;
	activeDiscountCampaigns: ActiveDiscountProgram[];
	onSlotClick: (dateKey: string, slotId: string) => void;
}

function resolveSlotBadge(room: Room, dateKey: string, slot: TimeSlot, campaigns: ActiveDiscountProgram[]): string | null {
	if (campaigns.length === 0) return null;
	const singleSlot: PricingSelectedSlot = {
		key: 'temp',
		roomId: room.id,
		date: dateKey,
		slotId: slot.id,
		price: slot.price,
		isOvernight: slot.isOvernight,
		startTime: slot.startTime,
		endTime: slot.endTime,
	};
	const best = resolveBestProgramForSlot(singleSlot, dateKey, room.id, room.roomType, campaigns, slot.price);
	if (!best?.program) return null;
	return best.program.discountType === 'PERCENTAGE'
		? `-${Math.round(toPercentValue(best.program.discountValue))}%`
		: `-${toKDisplay(best.program.discountValue)}`;
}

function BookingWidgetRow({ room, dateKey, isTodayRow, showYear, timeSlots, selectedSlotIds, activeDiscountCampaigns, onSlotClick }: BookingWidgetRowProps) {
	const day = useAvailabilityStore((state) => state.availabilityByRoom[room.id]?.[dateKey]);
	const date = parseDateKey(dateKey);
	// Most far-future days have no campaign, so filter once per row instead of per cell.
	const campaignsOnDate = activeDiscountCampaigns.filter(
		(campaign) => dateKey >= campaign.startDate && dateKey <= campaign.endDate,
	);

	return (
		<tr data-date={dateKey} className="h-[36px] sm:h-[48px]">
			<td
				className={`${CALENDAR_CELL_BORDER_CLASS} sticky left-0 z-20 p-0!`}
				style={{ backgroundColor: isTodayRow ? '#FAFAF8' : '#FFFFFF', borderRight: '1px solid #E7E5E4' }}
			>
				<div
					className={`flex flex-col items-center justify-center py-1 px-0.5 sm:py-2 sm:px-1 h-full ${isTodayRow ? 'border-l-2 sm:border-l-3 border-l-[#D97D48]' : 'border-l-2 sm:border-l-3 border-l-transparent'}`}
					style={isTodayRow ? { boxShadow: TODAY_ROW_BOX_SHADOW } : undefined}
				>
					<span className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-wide ${isTodayRow ? 'text-[#D97D48]' : 'text-stone-500'}`} suppressHydrationWarning>
						{isTodayRow ? 'Nay' : getDayLabel(date)}
					</span>
					<span className={`text-[9px] sm:text-xs font-semibold ${isTodayRow ? 'text-[#D97D48]' : 'text-stone-600'}`} suppressHydrationWarning>
						{date.getDate()}/{date.getMonth() + 1}{showYear ? `/${String(date.getFullYear()).slice(2)}` : ''}
					</span>
				</div>
			</td>

			{timeSlots.map((slot) => {
				const slotWithStatus = day?.timeSlots.find((item) => item.timeSlot.id === slot.id);
				const slotStatus = getSlotStatusFromAvailability(slotWithStatus);
				const isSelected = selectedSlotIds.includes(`|${slot.id}|`);
				const canInteract = slotStatus === 'AVAILABLE';
				const isBooked = slotStatus === 'BOOKED';
				const badgeText = canInteract
					? getCampaignDiscountBadge(slotWithStatus?.discountType, slotWithStatus?.discountValue)
						?? resolveSlotBadge(room, dateKey, slot, campaignsOnDate)
					: null;

				return (
					<td
						key={slot.id}
						className={`${CALENDAR_CELL_BORDER_CLASS} text-center p-0.5 sm:p-1.5 align-middle relative`}
						style={{ backgroundColor: isTodayRow ? '#FAFAF8' : '#FFFFFF' }}
					>
						<button
							onClick={() => canInteract && onSlotClick(dateKey, slot.id)}
							disabled={!canInteract}
							className={`w-full h-[22px] sm:h-[32px] rounded font-medium text-[10px] sm:text-xs transition-colors duration-200 flex flex-col items-center justify-center shadow-sm relative ${isSelected
								? 'bg-[#D97D48] text-white shadow-md border border-[#D97D48]'
								: isBooked
									? 'bg-[#CF5B51] text-white border border-transparent cursor-not-allowed shadow-none'
									: canInteract
										? 'bg-white text-teal-700 border border-teal-200 hover:border-teal-500 hover:shadow-md'
										: 'bg-white text-teal-700 border border-teal-200 cursor-not-allowed shadow-none'
							}`}
							style={isTodayRow ? { boxShadow: TODAY_SLOT_BOX_SHADOW } : undefined}
						>
							{badgeText && (
								<div className={`absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 px-1 py-0.5 rounded shadow-sm z-10 whitespace-nowrap text-[6px] sm:text-[8px] font-bold ${isSelected ? 'bg-white text-[#D97D48]' : 'bg-[#046B5A] text-white'}`}>
									{badgeText}
								</div>
							)}
						</button>
					</td>
				);
			})}
		</tr>
	);
}

export default memo(BookingWidgetRow);

import { useAvailabilityStore } from "@/store/availabilityStore";
import type { TimeSlot } from "@/types/room";
import { useMemo } from "react";

/**
 * Each room's slot columns, taken from its first loaded day. The result only
 * changes when a column actually changes, so memoized rows are not invalidated
 * by every availability update.
 */
export function useRoomSlotColumns(roomIds: string[], dateKeys: string[]): Map<string, TimeSlot[]> {
	const signature = useAvailabilityStore((state) => {
		let result = "";
		for (const roomId of roomIds) {
			const days = state.availabilityByRoom[roomId];
			if (!days) continue;
			for (const dateKey of dateKeys) {
				const slots = days[dateKey]?.timeSlots;
				if (slots?.length) {
					result += `${roomId}[${slots.map((s) => `${s.timeSlot.id}:${s.timeSlot.startTime}:${s.timeSlot.endTime}:${s.timeSlot.price}`).join(",")}]`;
					break;
				}
			}
		}
		return result;
	});

	return useMemo(() => {
		const { availabilityByRoom } = useAvailabilityStore.getState();
		const columns = new Map<string, TimeSlot[]>();
		for (const roomId of roomIds) {
			const days = availabilityByRoom[roomId];
			if (!days) continue;
			for (const dateKey of dateKeys) {
				const slots = days[dateKey]?.timeSlots;
				if (slots?.length) {
					columns.set(
						roomId,
						slots
							.map((s) => s.timeSlot)
							.filter(Boolean)
							.sort((a, b) => parseInt(a.startTime.replace(":", ""), 10) - parseInt(b.startTime.replace(":", ""), 10)),
					);
					break;
				}
			}
		}
		return columns;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [signature]);
}

import type {
	ApiSlotStatus,
	DayAvailability,
	RoomAvailability,
	SlotStatus,
	SSEAvailabilityEvent,
	TimeSlotWithStatus,
} from '@/types/timeslot';
import { create } from 'zustand';

/**
 * Memory-only availability cache.
 *
 * Structure: availabilityByRoom[roomId][date] = DayAvailability
 *
 * - mergeAvailabilitySnapshot: called after REST GET /api/v1/bookings/availability
 * - updateSlot: called on each SSE delta event
 * - cache clears naturally on browser reload because this store is not persisted
 */

type AvailabilityByRoom = Record<string, Record<string, DayAvailability>>;

interface AvailabilityState {
	availabilityByRoom: AvailabilityByRoom;
	mergeAvailabilitySnapshot: (data: RoomAvailability[]) => void;
	setInitialData: (data: RoomAvailability[]) => void;
	updateSlot: (event: SSEAvailabilityEvent) => void;
	getSlotStatus: (roomId: string, date: string, timeSlotId: string) => SlotStatus | undefined;
	clearAll: () => void;
}

export const normalizeSlotStatus = (status: ApiSlotStatus | undefined): SlotStatus | undefined => {
	if (!status) return undefined;
	return status === 'BOOKED' ? 'BOOKED' : 'AVAILABLE';
};

export const getSlotStatusFromAvailability = (
	slotWithStatus: TimeSlotWithStatus | undefined,
): SlotStatus | undefined => {
	if (!slotWithStatus) return undefined;

	const status = normalizeSlotStatus(slotWithStatus.status);
	if (status) return status;

	const isAvail = slotWithStatus.isAvailable ?? (slotWithStatus as any).isActive;
	if (typeof isAvail === 'boolean') return isAvail ? 'AVAILABLE' : 'BOOKED';

	return undefined;
};

export const useAvailabilityStore = create<AvailabilityState>((set, get) => ({
	availabilityByRoom: {},

	mergeAvailabilitySnapshot: (data: RoomAvailability[]) => {
		set((state) => {
			const availabilityByRoom: AvailabilityByRoom = { ...state.availabilityByRoom };

			for (const roomAvail of data) {
				const roomMap = { ...(availabilityByRoom[roomAvail.roomId] || {}) };

				for (const day of roomAvail.timeslots) {
					roomMap[day.date] = {
						...day,
						timeSlots: [...day.timeSlots],
					};
				}

				availabilityByRoom[roomAvail.roomId] = roomMap;
			}

			return { availabilityByRoom };
		});
	},

	setInitialData: (data: RoomAvailability[]) => {
		get().mergeAvailabilitySnapshot(data);
	},

	updateSlot: (event: SSEAvailabilityEvent) => {
		set((state) => {
			const { roomId, date, timeSlotId } = event;
			const status = normalizeSlotStatus(event.status);
			if (!status) return state;

			const existingDay = state.availabilityByRoom[roomId]?.[date];
			if (!existingDay) return state;

			const nextTimeSlots = existingDay.timeSlots.map((slotWithStatus) => {
				if (slotWithStatus.timeSlot.id !== timeSlotId) return slotWithStatus;

				return {
					...slotWithStatus,
					status,
					isAvailable: status === 'AVAILABLE',
					bookingId: status === 'AVAILABLE' ? null : slotWithStatus.bookingId,
				};
			});

			const availabilityByRoom: AvailabilityByRoom = {
				...state.availabilityByRoom,
				[roomId]: {
					...state.availabilityByRoom[roomId],
					[date]: {
						...existingDay,
						timeSlots: nextTimeSlots,
					},
				},
			};

			return { availabilityByRoom };
		});
	},

	getSlotStatus: (roomId: string, date: string, timeSlotId: string): SlotStatus | undefined => {
		const slot = get().availabilityByRoom[roomId]?.[date]?.timeSlots.find(
			(slotWithStatus) => slotWithStatus.timeSlot.id === timeSlotId,
		);
		return getSlotStatusFromAvailability(slot);
	},

	clearAll: () => {
		set({ availabilityByRoom: {} });
	},
}));

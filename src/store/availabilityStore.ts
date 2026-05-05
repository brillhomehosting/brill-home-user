import type { RoomAvailability, SlotStatus, SSEAvailabilityEvent } from '@/types/timeslot';
import { create } from 'zustand';

/**
 * Zustand store for realtime slot availability.
 *
 * Structure: statusMap[roomId][date][timeSlotId] = SlotStatus
 *
 * - setInitialData: called after REST GET /api/v1/bookings/availability
 * - updateSlot: called on each SSE delta event
 * - getSlotStatus: read status for a specific slot
 */

interface AvailabilityState {
	// Map: roomId -> date -> timeSlotId -> SlotStatus
	statusMap: Record<string, Record<string, Record<string, SlotStatus>>>;

	// Actions
	setInitialData: (data: RoomAvailability[]) => void;
	updateSlot: (event: SSEAvailabilityEvent) => void;
	getSlotStatus: (roomId: string, date: string, timeSlotId: string) => SlotStatus;
	clearAll: () => void;
}

export const useAvailabilityStore = create<AvailabilityState>((set, get) => ({
	statusMap: {},

	setInitialData: (data: RoomAvailability[]) => {
		const newMap: Record<string, Record<string, Record<string, SlotStatus>>> = {};

		for (const roomAvail of data) {
			const roomMap: Record<string, Record<string, SlotStatus>> = {};

			for (const day of roomAvail.timeslots) {
				const dayMap: Record<string, SlotStatus> = {};

				for (const slotWithStatus of day.timeSlots) {
					// The backend returns `status` as 'AVAILABLE', 'BOOKED', 'HOLDING' directly
					// Fallback to legacy `isActive` if status is somehow missing
					let status: SlotStatus = slotWithStatus.status as SlotStatus;
					
					if (!status) {
						const isAvail = slotWithStatus.isAvailable ?? (slotWithStatus as any).isActive;
						status = isAvail ? 'AVAILABLE' : 'BOOKED';
					}
					
					dayMap[slotWithStatus.timeSlot.id] = status;
				}

				roomMap[day.date] = dayMap;
			}

			newMap[roomAvail.roomId] = roomMap;
		}

		set({ statusMap: newMap });
	},

	updateSlot: (event: SSEAvailabilityEvent) => {
		set((state) => {
			const { roomId, date, timeSlotId, status } = event;

			// Deep clone only the affected path to avoid unnecessary re-renders
			const newMap = { ...state.statusMap };
			const roomMap = { ...(newMap[roomId] || {}) };
			const dayMap = { ...(roomMap[date] || {}) };

			dayMap[timeSlotId] = status;
			roomMap[date] = dayMap;
			newMap[roomId] = roomMap;

			return { statusMap: newMap };
		});
	},

	getSlotStatus: (roomId: string, date: string, timeSlotId: string): SlotStatus => {
		const state = get();
		return state.statusMap[roomId]?.[date]?.[timeSlotId] ?? 'AVAILABLE';
	},

	clearAll: () => {
		set({ statusMap: {} });
	},
}));

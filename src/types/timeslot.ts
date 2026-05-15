import { ApiResponse, BaseEntity } from ".";

// Slot status for availability
export type SlotStatus = 'AVAILABLE' | 'BOOKED';
export type ApiSlotStatus = SlotStatus | string;

// TimeSlot types for availability
export interface TimeSlot extends BaseEntity {
	roomId: string;
	startTime: string;
	endTime: string;
	isOvernight: boolean;
	price: number;
}

export interface TimeSlotWithStatus {
	timeSlot: TimeSlot;
	isAvailable: boolean;
	bookingId: string | null;
	// Derived status: AVAILABLE when isAvailable=true, BOOKED when false.
	status?: ApiSlotStatus;
}

export interface DayAvailability {
	date: string;
	timeSlots: TimeSlotWithStatus[];
}

// New centralized availability response
export interface RoomAvailability {
	roomId: string;
	timeslots: DayAvailability[];
}

export type AvailabilityApiResponse = ApiResponse<RoomAvailability[]>;

// SSE event payload
export interface SSEAvailabilityEvent {
	roomId: string;
	date: string;
	timeSlotId: string;
	status: ApiSlotStatus;
}

// Legacy types kept for backward compatibility
export type RoomTimeSlotsApiResponse = ApiResponse<TimeSlot[]>;
export type TimeSlotAvailabilityApiResponse = ApiResponse<DayAvailability[]>;

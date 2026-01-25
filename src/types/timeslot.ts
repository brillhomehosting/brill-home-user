import { ApiResponse, BaseEntity } from ".";

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
	isActive: boolean;
}

export interface DayAvailability {
	date: string;
	timeSlots: TimeSlotWithStatus[];
}

export type RoomTimeSlotsApiResponse = ApiResponse<TimeSlot[]>;
export type TimeSlotAvailabilityApiResponse = ApiResponse<DayAvailability[]>;
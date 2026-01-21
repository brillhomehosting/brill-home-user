// Base entity with common fields
export interface BaseEntity {
	id: string;
	isDeleted: boolean;
	createdAt: string;
	updatedAt: string;
}

// Room Image
export interface RoomImage extends BaseEntity {
	url: string;
}

// Room Amenity
export interface RoomAmenity extends BaseEntity {
	name: string;
	icon: string;
	description: string;
	isHighlight?: boolean;
}

// Room
export interface Room extends BaseEntity {
	name: string;
	description: string;
	capacity: number;
	numberOfBeds: number | null;
	area: number | null;
	images: RoomImage[];
	isActive: boolean;
	amenities: RoomAmenity[];
	hourlyRate: number | null;
	overnightRate: number | null;
	roomType: string;
}

// Pagination Sort
export interface PaginationSort {
	unsorted: boolean;
	sorted: boolean;
	empty: boolean;
}

// Pageable Info
export interface Pageable {
	pageNumber: number;
	pageSize: number;
	sort: PaginationSort;
	offset: number;
	unpaged: boolean;
	paged: boolean;
}

// Paginated Response Data
export interface PaginatedData<T> {
	content: T[];
	pageable: Pageable;
	totalElements: number;
	totalPages: number;
	last: boolean;
	numberOfElements: number;
	size: number;
	number: number;
	sort: PaginationSort;
	first: boolean;
	empty: boolean;
}

// API Response Wrapper
export interface ApiResponse<T> {
	success: boolean;
	data: T;
	message: string;
	error: string | null;
}

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

// Specific Response Types
export type RoomsApiResponse = ApiResponse<PaginatedData<Room>>;
export type RoomApiResponse = ApiResponse<Room>;
export type RoomTimeSlotsApiResponse = ApiResponse<TimeSlot[]>;
export type TimeSlotAvailabilityApiResponse = ApiResponse<DayAvailability[]>;

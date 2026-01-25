import { ApiResponse, BaseEntity, PaginatedData } from ".";

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

// Specific Response Types
export type RoomsApiResponse = ApiResponse<PaginatedData<Room>>;
export type RoomApiResponse = ApiResponse<Room>;

// Re-export timeslot types for convenience
export * from "./timeslot";

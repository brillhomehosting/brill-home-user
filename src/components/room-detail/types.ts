import { StaticImageData } from "next/image";

export interface TimeBlock {
	id: string;
	time: string;
	icon: string;
	basePrice: number;
}

export interface SlotData {
	available: boolean;
	price: number;
}

export interface Room {
	id: string;
	title: string;
	location: string;
	price: string;
	area: number;
	bedrooms: number;
	bathrooms: number;
	expectedYield: string;
	totalYield: string;
	currentValue: string;
	tenYearValue: string;
	description: string;
	facilities: { icon: string; name: string }[];
	images: string[];
	agent: {
		name: string;
		role: string;
		avatar: string;
	};
	timeBlocks: TimeBlock[];
	slotData?: Record<string, SlotData>;
}

export interface SimilarRoom {
	id: string;
	name: string;
	description: string;
	hourlyRate: number;
	images: StaticImageData[];
	capacity: number;
	beds: number;
	features: string[];
}

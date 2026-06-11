import type { DayAvailability, RoomAvailability } from '@/types/timeslot';

export type AvailabilityByRoom = Record<string, Record<string, DayAvailability>>;

const parseDateKey = (date: string): Date => {
	const [year = '0', month = '1', day = '1'] = date.split('-');
	return new Date(Number(year), Number(month) - 1, Number(day));
};

const formatDateKey = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

export const getDateKeysInRange = (startDate: string, endDate: string): string[] => {
	const start = parseDateKey(startDate);
	const end = parseDateKey(endDate);
	const dates: string[] = [];

	for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
		dates.push(formatDateKey(cursor));
	}

	return dates;
};

export const selectCachedAvailabilityRange = ({
	availabilityByRoom,
	startDate,
	endDate,
	roomId,
	roomIds,
}: {
	availabilityByRoom: AvailabilityByRoom;
	startDate: string;
	endDate: string;
	roomId?: string;
	roomIds?: string[];
}): { data: RoomAvailability[]; isComplete: boolean } => {
	const dateKeys = getDateKeysInRange(startDate, endDate);
	const targetRoomIds = roomId
		? [roomId]
		: roomIds && roomIds.length > 0
			? roomIds
			: Object.keys(availabilityByRoom);

	if (targetRoomIds.length === 0 || dateKeys.length === 0) {
		return { data: [], isComplete: false };
	}

	const data: RoomAvailability[] = [];
	let isComplete = true;

	for (const targetRoomId of targetRoomIds) {
		const roomMap = availabilityByRoom[targetRoomId];
		if (!roomMap) {
			isComplete = false;
			continue;
		}

		const days: DayAvailability[] = [];
		for (const dateKey of dateKeys) {
			const day = roomMap[dateKey];
			if (!day) {
				isComplete = false;
				continue;
			}
			days.push(day);
		}

		if (days.length > 0) {
			data.push({ roomId: targetRoomId, timeslots: days });
		}
	}

	return {
		data,
		isComplete: isComplete && data.length === targetRoomIds.length,
	};
};

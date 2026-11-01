// Pure date helpers for the booking calendar. Keep runtime imports free of `@/`
// so tests can load this file directly through Node type stripping.
export const YESTERDAY_ROW_CUTOFF_HOUR = 19;
export const FIRST_WINDOW_DAYS = 14;
export const NEXT_WINDOW_DAYS = 30;

export interface AvailabilityWindow {
	startDate: string;
	endDate: string;
	rowCount: number;
}

export const toDateKey = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

export const parseDateKey = (key: string): Date => {
	const [year = '0', month = '1', day = '1'] = key.split('-');
	return new Date(Number(year), Number(month) - 1, Number(day));
};

export const shouldShowYesterdayRow = (now: Date): boolean => now.getHours() < YESTERDAY_ROW_CUTOFF_HOUR;

export function buildBookingDateKeys(now: Date, maxAdvanceDays: number): string[] {
	const firstOffset = shouldShowYesterdayRow(now) ? -1 : 0;
	const keys: string[] = [];
	for (let offset = firstOffset; offset <= maxAdvanceDays; offset++) {
		keys.push(toDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)));
	}
	return keys;
}

export function splitIntoWindows(
	dateKeys: string[],
	firstSize: number = FIRST_WINDOW_DAYS,
	nextSize: number = NEXT_WINDOW_DAYS,
): AvailabilityWindow[] {
	const windows: AvailabilityWindow[] = [];
	let cursor = 0;
	while (cursor < dateKeys.length) {
		const size = windows.length === 0 ? firstSize : nextSize;
		const slice = dateKeys.slice(cursor, cursor + size);
		windows.push({ startDate: slice[0]!, endDate: slice[slice.length - 1]!, rowCount: slice.length });
		cursor += slice.length;
	}
	return windows;
}

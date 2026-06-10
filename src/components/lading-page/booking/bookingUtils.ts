// Generate dates for next N days
export const generateDates = (count: number) => {
	return Array.from({ length: count }, (_, i) => {
		const date = new Date();
		date.setDate(date.getDate() + i);
		return date;
	});
};

// Vietnamese day labels - short version for mobile
export const getDayLabel = (date: Date) => {
	const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
	return days[date.getDay()];
};

// Format date as YYYY-MM-DD
export const formatDate = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

// Check if date is today
export const isToday = (date: Date) => {
	const today = new Date();
	return date.toDateString() === today.toDateString();
};

// Get icon for time slot based on time
export const getTimeSlotIcon = (startTime: string, isOvernight: boolean): string => {
	if (isOvernight) return '🌙';
	const hour = parseInt(startTime.split(':')[0] || '12', 10);
	if (hour >= 5 && hour < 12) return '☀️'; // Sáng
	if (hour >= 12 && hour < 17) return '☀️'; // Trưa
	if (hour >= 17 && hour < 21) return '🌅'; // Chiều tối
	return '🌙'; // Đêm
};

// Check if slot's start time has passed
export const isPastSlot = (date: Date, startTime: string): boolean => {
	const now = new Date();
	const timeParts = startTime.split(':');
	const hours = parseInt(timeParts[0] || '0', 10);
	const minutes = parseInt(timeParts[1] || '0', 10);
	const slotTime = new Date(date);
	slotTime.setHours(hours, minutes, 0, 0);

	return now > slotTime;
};

// Check if slot's end time has passed. For overnight slots, the end time
// falls on the day after `date`, so it can still be valid after `date` is
// no longer "today".
export const isEndPastSlot = (date: Date, endTime: string, isOvernight: boolean): boolean => {
	const now = new Date();
	const timeParts = endTime.split(':');
	const hours = parseInt(timeParts[0] || '0', 10);
	const minutes = parseInt(timeParts[1] || '0', 10);
	const endDate = new Date(date);
	endDate.setHours(hours, minutes, 0, 0);
	if (isOvernight) endDate.setDate(endDate.getDate() + 1);

	return now > endDate;
};

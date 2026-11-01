// Borders for calendar cells. The tables use separate borders because collapsed
// borders stay behind while a sticky header scrolls, letting rows show through.
export const CALENDAR_CELL_BORDER_CLASS = 'border-b border-e last:border-e-0 border-[var(--table-border-color)]';

// Vietnamese day labels - short version for mobile
export const getDayLabel = (date: Date) => {
	const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
	return days[date.getDay()];
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

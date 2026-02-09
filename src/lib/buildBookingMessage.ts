type SlotInfo = {
	timeRange: string;
	price: string;
};

type BuildBookingMessageParams = {
	roomName: string;
	groupedByDate: Record<string, SlotInfo[]>;
	totalAmount: number;
};

function pickRandom<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)]!;
}

export function buildBookingMessage({ roomName, groupedByDate }: BuildBookingMessageParams): string {
	const entries = Object.entries(groupedByDate);

	const dateParts = entries.map(([date, slots]) => {
		const times = slots.map(s => s.timeRange).join(', ');
		return `ngày ${date} khung giờ ${times}`;
	});

	const timePart = dateParts.join(' và ');

	const openers = [
		'Hello shop',
		'Hi shop',
		'Chào shop',
		'Shop ơi',
	];

	const opener = pickRandom(openers);

	return `${opener}, mình muốn đặt ${roomName} ${timePart}.`;
}

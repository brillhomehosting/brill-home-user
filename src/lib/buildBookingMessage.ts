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

// Format slots for a single date in a casual way
function formatSlots(slots: SlotInfo[]): string {
	if (slots.length === 1) {
		return `${slots[0]!.timeRange}`;
	}
	return slots.map(s => s.timeRange).join(', ');
}

// Build a natural-sounding description of what dates/times the user wants
function buildBody(roomName: string, groupedByDate: Record<string, SlotInfo[]>): string {
	const entries = Object.entries(groupedByDate);

	if (entries.length === 1) {
		const [date, slots] = entries[0]!;
		const times = formatSlots(slots);
		const templates = [
			`mình muốn đặt ${roomName} ngày ${date} lúc ${times} nha`,
			`cho mình book ${roomName} ngày ${date}, ${times} được không ạ`,
			`mình lấy ${roomName} ngày ${date} ca ${times} nha bạn`,
			`mình đặt ${roomName} ngày ${date} khung ${times} với ạ`,
		];
		return pickRandom(templates);
	}

	// Multiple dates
	const parts = entries.map(([date, slots]) => {
		const times = formatSlots(slots);
		return `${date} lúc ${times}`;
	});
	const last = parts.pop()!;
	const connector = pickRandom(['với', 'rồi', 'và']);
	const dateStr = parts.length > 0 ? parts.join(', ') + ` ${connector} ` + last : last;

	const templates = [
		`mình muốn đặt ${roomName} ngày ${dateStr} nha`,
		`cho mình book ${roomName} ngày ${dateStr} được không ạ`,
		`mình lấy ${roomName} ngày ${dateStr} nha bạn`,
	];
	return pickRandom(templates);
}

export function buildBookingMessage({ roomName, groupedByDate, totalAmount }: BuildBookingMessageParams): string {
	const body = buildBody(roomName, groupedByDate);

	const openers = [
		'Hi bạn ơi',
		'Hello shop',
		'Chào bạn',
		'Hi shop',
		'Alo bạn ơi',
	];

	const closings = [
		`tổng ${totalAmount}k đúng ko ạ? Bạn check giúp mình nha`,
		`mình tính ra ${totalAmount}k, bạn xác nhận giúp mình với nha`,
		`${totalAmount}k phải ko bạn? Còn trống thì giữ cho mình nha`,
		`tổng là ${totalAmount}k ha, bạn book giúp mình với ạ`,
		`bạn xem giúp mình còn trống ko nha, tổng ${totalAmount}k`,
	];

	const opener = pickRandom(openers);
	const closing = pickRandom(closings);

	const endings = ['😊', '🥰', '❤️', '😄', '🤗', '💕'];
	const ending = pickRandom(endings);

	// Randomly pick a full message shape
	const shapes = [
		`${opener}, ${body}. ${closing}. Cảm ơn nhaa ${ending}`,
		`${opener}, ${body}, ${closing} ${ending}`,
		`${opener} ${body}. ${closing}. Thanks bạn ${ending}`,
		`${opener} ${body}, ${closing}. Cảm ơn nha ${ending}`,
	];

	return pickRandom(shapes);
}

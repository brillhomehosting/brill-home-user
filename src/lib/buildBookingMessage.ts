type SlotInfo = {
	timeRange: string;
	price: string;
};

type BuildBookingMessageParams = {
	roomName: string;
	groupedByDate: Record<string, SlotInfo[]>;
	totalAmount: number;
};

const GREETINGS = [
	'Hi shop, mình muốn đặt phòng nha',
	'Chào bạn, mình muốn book phòng ạ',
	'Hello, cho mình đặt phòng với nha',
	'Chào shop, mình cần đặt phòng ạ',
];

const CLOSINGS = [
	'Bạn check giúp mình còn trống không nha, cảm ơn!',
	'Bạn xem giúp mình còn phòng không ạ, thanks!',
	'Bạn confirm giúp mình với nha, cảm ơn nhiều!',
	'Cho mình hỏi còn trống không ạ? Cảm ơn bạn!',
	'Mình đặt trước nha, bạn check dùm mình với!',
];

function pickRandom<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)]!;
}

export function buildBookingMessage({ roomName, groupedByDate, totalAmount }: BuildBookingMessageParams): string {
	const greeting = pickRandom(GREETINGS);
	const closing = pickRandom(CLOSINGS);

	let message = `${greeting}\n\n`;
	message += `Phòng: ${roomName}\n`;

	Object.entries(groupedByDate).forEach(([date, slots]) => {
		const slotTexts = slots.map(slot => `${slot.timeRange} (${slot.price})`).join(', ');
		message += `- Ngày ${date}: ${slotTexts}\n`;
	});

	message += `\nTổng ${totalAmount}k. ${closing}`;

	return message;
}

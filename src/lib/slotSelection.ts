export interface SlotKeyParts {
	roomId: string;
	date: string;
	slotId: string;
}

export interface LinearSelectableSlot extends SlotKeyParts {
	key: string;
	price: number;
	isAvailable: boolean;
}

export interface ApplySlotSelectionParams {
	linearSlots: LinearSelectableSlot[];
	selectedSlots: Set<string>;
	clickedKey: string;
	existingSlotPrices?: Map<string, number>;
}

export interface SlotSelectionResult {
	selectedSlots: Set<string>;
	slotPrices: Map<string, number>;
}

export function parseSlotKey(slotKey: string): SlotKeyParts | null {
	const parts = slotKey.split("::");
	if (parts.length !== 3) return null;
	const [roomId, date, slotId] = parts;
	if (!roomId || !date || !slotId) return null;
	return { roomId, date, slotId };
}

export function getSelectionContext(selectedSlots: Set<string>): {
	roomId: string;
	date: string;
} | null {
	const first = Array.from(selectedSlots)[0];
	if (!first) return null;
	const parsed = parseSlotKey(first);
	if (!parsed) return null;
	return { roomId: parsed.roomId, date: parsed.date };
}

function toSlotPrices(
	keys: Set<string>,
	byKey: Map<string, LinearSelectableSlot>,
	existingSlotPrices?: Map<string, number>,
): Map<string, number> {
	const result = new Map<string, number>();
	keys.forEach((key) => {
		const slot = byKey.get(key);
		if (slot) {
			result.set(key, slot.price);
			return;
		}
		const preservedPrice = existingSlotPrices?.get(key);
		if (typeof preservedPrice === "number") {
			result.set(key, preservedPrice);
		}
	});
	return result;
}

function parseDateToDayNumber(dateStr: string): number | null {
	const [yearStr, monthStr, dayStr] = dateStr.split("-");
	const year = Number(yearStr);
	const month = Number(monthStr);
	const day = Number(dayStr);
	if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
		return null;
	}
	if (month < 1 || month > 12 || day < 1 || day > 31) {
		return null;
	}
	return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function buildSlotOrder(linearSlots: LinearSelectableSlot[]): Map<string, number> {
	const order = new Map<string, number>();
	linearSlots.forEach((slot) => {
		if (!order.has(slot.slotId)) {
			order.set(slot.slotId, order.size);
		}
	});
	return order;
}

function toGlobalPosition(
	slot: SlotKeyParts,
	slotOrder: Map<string, number>,
	slotCountPerDay: number,
): number | null {
	const dayNumber = parseDateToDayNumber(slot.date);
	const slotOrderIndex = slotOrder.get(slot.slotId);
	if (dayNumber === null || slotOrderIndex === undefined || slotCountPerDay <= 0) {
		return null;
	}
	return dayNumber * slotCountPerDay + slotOrderIndex;
}

export function applySlotSelection({
	linearSlots,
	selectedSlots,
	clickedKey,
	existingSlotPrices,
}: ApplySlotSelectionParams): SlotSelectionResult {
	const byKey = new Map(linearSlots.map((slot) => [slot.key, slot]));
	const clicked = byKey.get(clickedKey);
	if (!clicked || !clicked.isAvailable) {
		return {
			selectedSlots: new Set(selectedSlots),
			slotPrices: toSlotPrices(selectedSlots, byKey, existingSlotPrices),
		};
	}

	if (selectedSlots.size === 0) {
		const next = new Set([clickedKey]);
		return {
			selectedSlots: next,
			slotPrices: toSlotPrices(next, byKey, existingSlotPrices),
		};
	}

	const selectedContext = getSelectionContext(selectedSlots);
	const activeRoomId = selectedContext?.roomId;

	// Allow multi-day selection as long as slots stay consecutive in the same room.
	if (!activeRoomId || clicked.roomId !== activeRoomId) {
		const next = new Set([clickedKey]);
		return {
			selectedSlots: next,
			slotPrices: toSlotPrices(next, byKey, existingSlotPrices),
		};
	}

	const slotOrder = buildSlotOrder(linearSlots);
	const slotCountPerDay = slotOrder.size;
	const clickedMeta = parseSlotKey(clickedKey);
	const clickedPosition =
		clickedMeta
			? toGlobalPosition(clickedMeta, slotOrder, slotCountPerDay)
			: null;
	if (clickedPosition === null) {
		const reset = new Set([clickedKey]);
		return {
			selectedSlots: reset,
			slotPrices: toSlotPrices(reset, byKey, existingSlotPrices),
		};
	}

	const selectedPositions = Array.from(selectedSlots)
		.map((key) => {
			const parsed = parseSlotKey(key);
			if (!parsed || parsed.roomId !== clicked.roomId) return null;
			const position = toGlobalPosition(parsed, slotOrder, slotCountPerDay);
			if (position === null) return null;
			return { key, position };
		})
		.filter((item): item is { key: string; position: number } => Boolean(item));

	if (selectedPositions.length === 0) {
		const next = new Set([clickedKey]);
		return {
			selectedSlots: next,
			slotPrices: toSlotPrices(next, byKey, existingSlotPrices),
		};
	}

	const minPosition = Math.min(...selectedPositions.map((item) => item.position));
	const maxPosition = Math.max(...selectedPositions.map((item) => item.position));
	const nextSet = new Set(selectedSlots);

	// Deselect flow
	if (nextSet.has(clickedKey)) {
		if (nextSet.size === 1) {
			return { selectedSlots: new Set(), slotPrices: new Map() };
		}

		if (clickedPosition === minPosition || clickedPosition === maxPosition) {
			nextSet.delete(clickedKey);
			return {
				selectedSlots: nextSet,
				slotPrices: toSlotPrices(nextSet, byKey, existingSlotPrices),
			};
		}

		const trimmed = new Set<string>();
		selectedPositions
			.filter((item) => item.position < clickedPosition)
			.forEach((item) => {
				trimmed.add(item.key);
			});
		if (trimmed.size === 0) {
			return { selectedSlots: new Set(), slotPrices: new Map() };
		}
		return {
			selectedSlots: trimmed,
			slotPrices: toSlotPrices(trimmed, byKey, existingSlotPrices),
		};
	}

	// Select flow
	const isAdjacent =
		clickedPosition === minPosition - 1 ||
		clickedPosition === maxPosition + 1;
	if (isAdjacent) {
		nextSet.add(clickedKey);
		return {
			selectedSlots: nextSet,
			slotPrices: toSlotPrices(nextSet, byKey, existingSlotPrices),
		};
	}

	// Not consecutive => reset to clicked slot only
	const reset = new Set([clickedKey]);
	return {
		selectedSlots: reset,
		slotPrices: toSlotPrices(reset, byKey, existingSlotPrices),
	};
}

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
): Map<string, number> {
	const result = new Map<string, number>();
	keys.forEach((key) => {
		const slot = byKey.get(key);
		if (slot) {
			result.set(key, slot.price);
		}
	});
	return result;
}

export function applySlotSelection({
	linearSlots,
	selectedSlots,
	clickedKey,
}: ApplySlotSelectionParams): SlotSelectionResult {
	const byKey = new Map(linearSlots.map((slot) => [slot.key, slot]));
	const clicked = byKey.get(clickedKey);
	if (!clicked || !clicked.isAvailable) {
		return { selectedSlots: new Set(selectedSlots), slotPrices: toSlotPrices(selectedSlots, byKey) };
	}

	const clickedIndex = linearSlots.findIndex((slot) => slot.key === clickedKey);
	if (clickedIndex === -1) {
		return { selectedSlots: new Set(selectedSlots), slotPrices: toSlotPrices(selectedSlots, byKey) };
	}

	if (selectedSlots.size === 0) {
		const next = new Set([clickedKey]);
		return { selectedSlots: next, slotPrices: toSlotPrices(next, byKey) };
	}

	const selectedMeta = Array.from(selectedSlots)
		.map((key) => byKey.get(key))
		.filter((slot): slot is LinearSelectableSlot => Boolean(slot));
	const activeRoomId = selectedMeta[0]?.roomId;

	// Allow multi-day selection as long as slots stay consecutive in the same room.
	if (!activeRoomId || clicked.roomId !== activeRoomId) {
		const next = new Set([clickedKey]);
		return { selectedSlots: next, slotPrices: toSlotPrices(next, byKey) };
	}

	const selectedIndices = linearSlots
		.map((slot, idx) => (selectedSlots.has(slot.key) ? idx : -1))
		.filter((idx) => idx !== -1);

	if (selectedIndices.length === 0) {
		const next = new Set([clickedKey]);
		return { selectedSlots: next, slotPrices: toSlotPrices(next, byKey) };
	}

	const minIdx = Math.min(...selectedIndices);
	const maxIdx = Math.max(...selectedIndices);
	const nextSet = new Set(selectedSlots);

	// Deselect flow
	if (nextSet.has(clickedKey)) {
		if (nextSet.size === 1) {
			return { selectedSlots: new Set(), slotPrices: new Map() };
		}

		if (clickedIndex === minIdx || clickedIndex === maxIdx) {
			nextSet.delete(clickedKey);
			return { selectedSlots: nextSet, slotPrices: toSlotPrices(nextSet, byKey) };
		}

		const keptIndices = selectedIndices.filter((idx) => idx < clickedIndex);
		const trimmed = new Set<string>();
		keptIndices.forEach((idx) => {
			const slot = linearSlots[idx];
			if (slot) trimmed.add(slot.key);
		});
		return { selectedSlots: trimmed, slotPrices: toSlotPrices(trimmed, byKey) };
	}

	// Select flow
	const isAdjacent = clickedIndex === minIdx - 1 || clickedIndex === maxIdx + 1;
	if (isAdjacent) {
		nextSet.add(clickedKey);
		return { selectedSlots: nextSet, slotPrices: toSlotPrices(nextSet, byKey) };
	}

	// Not consecutive => reset to clicked slot only
	const reset = new Set([clickedKey]);
	return { selectedSlots: reset, slotPrices: toSlotPrices(reset, byKey) };
}

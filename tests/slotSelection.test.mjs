import assert from 'node:assert/strict';
import test from 'node:test';
import { applySlotSelection, parseSlotKey } from '../src/lib/slotSelection.ts';

const SLOT_IDS = ['S0', 'S1', 'S2'];
const DATES = Array.from({ length: 60 }, (_, index) => new Date(Date.UTC(2026, 10, 1 + index)).toISOString().slice(0, 10));

const slotEntry = (date, slotId) => ({
  key: `R::${date}::${slotId}`,
  roomId: 'R',
  date,
  slotId,
  price: 100,
  isAvailable: !(slotId === 'S1' && date.endsWith('5')),
});

const entriesForDates = (dates) => dates.flatMap((date) => SLOT_IDS.map((slotId) => slotEntry(date, slotId)));
const ALL_ENTRIES = entriesForDates(DATES);

const entriesForClick = (clickedKey, selectedSlots) => {
  const dates = new Set([parseSlotKey(clickedKey).date]);
  selectedSlots.forEach((key) => dates.add(parseSlotKey(key).date));
  return entriesForDates([...dates].sort());
};

test('selecting across a day boundary keeps both slots', () => {
  const first = applySlotSelection({
    linearSlots: entriesForDates(['2026-11-14']),
    selectedSlots: new Set(),
    clickedKey: 'R::2026-11-14::S2',
  });
  const second = applySlotSelection({
    linearSlots: entriesForDates(['2026-11-14', '2026-11-15']),
    selectedSlots: first.selectedSlots,
    clickedKey: 'R::2026-11-15::S0',
    existingSlotPrices: first.slotPrices,
  });
  assert.deepEqual([...second.selectedSlots].sort(), ['R::2026-11-14::S2', 'R::2026-11-15::S0']);
});

test('a booked slot cannot be selected', () => {
  const result = applySlotSelection({
    linearSlots: entriesForDates(['2026-11-05']),
    selectedSlots: new Set(),
    clickedKey: 'R::2026-11-05::S1',
  });
  assert.equal(result.selectedSlots.size, 0);
});

// The calendar only passes the clicked day and the days already selected, so a
// click stays cheap on a 900-day calendar. It must select exactly like the full list.
test('reading only the relevant days selects exactly like reading every day', () => {
  let seed = 42;
  const random = (limit) => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed % limit;
  };

  for (let run = 0; run < 300; run++) {
    let full = { selectedSlots: new Set(), slotPrices: new Map() };
    let relevant = { selectedSlots: new Set(), slotPrices: new Map() };

    for (let click = 0; click < 40; click++) {
      const selected = [...full.selectedSlots];
      const target = selected.length > 0 && random(3) > 0
        ? ALL_ENTRIES.findIndex((entry) => entry.key === selected[random(selected.length)]) + random(5) - 2
        : random(ALL_ENTRIES.length);
      const clickedKey = ALL_ENTRIES[Math.max(0, Math.min(ALL_ENTRIES.length - 1, target))].key;

      full = applySlotSelection({
        linearSlots: ALL_ENTRIES,
        selectedSlots: full.selectedSlots,
        clickedKey,
        existingSlotPrices: full.slotPrices,
      });
      relevant = applySlotSelection({
        linearSlots: entriesForClick(clickedKey, relevant.selectedSlots),
        selectedSlots: relevant.selectedSlots,
        clickedKey,
        existingSlotPrices: relevant.slotPrices,
      });

      assert.deepEqual([...relevant.selectedSlots].sort(), [...full.selectedSlots].sort());
      assert.deepEqual([...relevant.slotPrices].sort(), [...full.slotPrices].sort());
    }
  }
});

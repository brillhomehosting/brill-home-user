import assert from 'node:assert/strict';
import test from 'node:test';
import { calculatePricing, formatCampaignWeekDays, getCampaignDiscountBadge, getComboDiscountDetail, getSavingsBadgeLabel } from '../src/lib/pricingUtils.ts';

const campaign = (overrides = {}) => ({
  id: 'combined', name: 'Room weekends', type: 'ROOM_WEEK_DAY',
  discountType: 'PERCENTAGE', discountValue: 10,
  startDate: '2026-09-01', endDate: '2026-09-30', status: 'ACTIVE',
  targetRoomId: 'room-a', targetWeekDay: false, targetRoomType: null,
  targetOvernightSlot: null, isDeleted: false, createdAt: '2026-09-01T00:00:00',
  ...overrides,
});
const slot = (overrides = {}) => ({
  key: 'slot-a', slotId: 'slot-a', roomId: 'room-a', date: '2026-09-19',
  price: 200000, isOvernight: false, startTime: '08:00', endTime: '12:00',
  ...overrides,
});
const price = (programs, slots = [slot()], extra = {}) => calculatePricing({
  roomId: 'room-a', roomType: 'VIP', activePrograms: programs,
  selectedSlots: slots, comboDiscounts: [], ...extra,
});

test('combined campaign wins over a larger discount of every lower type', () => {
  const programs = [
    campaign(),
    ...['ROOM', 'WEEK_DAY', 'ROOM_TYPE', 'SLOT_TYPE', 'ALL'].map(type => campaign({
      id: type, type, discountValue: 90, targetRoomType: 'VIP', targetOvernightSlot: false,
    })),
  ];
  const result = price(programs);
  assert.equal(result.programDiscountAmount, 20000);
  assert.equal(result.appliedProgram.program.id, 'combined');
});

test('combined campaign requires both room and weekday category', () => {
  for (const program of [campaign({ targetRoomId: 'room-b' }), campaign({ targetWeekDay: true }),
    campaign({ targetWeekDay: null }), campaign({ targetRoomId: null })]) {
    assert.equal(price([program]).programDiscountAmount, 0);
  }
  assert.equal(price([campaign({ targetWeekDay: true })], [slot({ date: '2026-09-18' })]).programDiscountAmount, 20000);
  assert.equal(price([campaign()], [slot({ date: '2026-09-20' })]).programDiscountAmount, 20000);
});

test('inactive, deleted and out-of-range campaigns do not apply', () => {
  for (const changes of [{ status: 'INACTIVE' }, { isDeleted: true },
    { startDate: '2026-09-20' }, { endDate: '2026-09-18' }]) {
    assert.equal(price([campaign(changes)]).programDiscountAmount, 0);
  }
  assert.equal(price([campaign({ startDate: '2026-09-19', endDate: '2026-09-19' })]).programDiscountAmount, 20000);
});

test('same type uses monetary discount then oldest creation date', () => {
  const fixed = campaign({ id: 'fixed', discountType: 'FIXED_AMOUNT', discountValue: 30000 });
  assert.equal(price([campaign(), fixed]).appliedProgram.program.id, 'fixed');
  const older = campaign({ id: 'older', discountValue: 15, createdAt: '2026-08-01T00:00:00' });
  assert.equal(price([fixed, older]).appliedProgram.program.id, 'older');
});

test('each slot can receive a different campaign and keeps its own cap', () => {
  const daytime = campaign({ id: 'day', type: 'SLOT_TYPE', targetOvernightSlot: false,
    discountType: 'FIXED_AMOUNT', discountValue: 300000 });
  const fallback = campaign({ id: 'all', type: 'ALL', discountValue: 20 });
  const result = price([daytime, fallback], [slot(), slot({ key: 'night', isOvernight: true })]);
  assert.equal(result.programDiscountAmount, 240000);
  assert.equal(result.totalAmount, 160000);
  assert.equal(result.dailyBreakdown[0].appliedPrograms.length, 2);
  assert.equal(result.appliedProgram, null);
});

test('percentage points of one mean one percent', () => {
  assert.equal(price([campaign({ discountValue: 1 })]).programDiscountAmount, 2000);
  assert.equal(price([campaign({ discountValue: 0.5 })]).programDiscountAmount, 1000);
});

test('percentage discounts round per slot after actual holiday surcharge', () => {
  const slots = [100005, 100004, 100003, 100002].map((amount, i) => slot({ key: String(i), price: amount }));
  const result = price([campaign()], slots, { holidayByDate: new Map([['2026-09-19', {
    isHoliday: true, surchargeType: 'FIXED_AMOUNT', surchargeValue: 50000,
  }]]) });
  assert.equal(result.holidaySurchargeAmount, 150000);
  assert.equal(result.programDiscountAmount, 55001);
});

test('multi-day bookings apply combined scope only on matching dates', () => {
  const result = price([campaign()], [slot(), slot({ key: 'monday', date: '2026-09-21' })]);
  assert.equal(result.programDiscountAmount, 20000);
  assert.equal(result.dailyBreakdown[1].programDiscountAmount, 0);
});

test('availability campaign values produce slot badge labels', () => {
  assert.equal(getCampaignDiscountBadge('PERCENTAGE', 15), '-15%');
  assert.equal(getCampaignDiscountBadge('FIXED_AMOUNT', 50000), '-50k');
  assert.equal(getCampaignDiscountBadge(null, null), null);
});

// Combo: same ROOM 1 prices and tiers as ComboCyclePricingTest in brill-home-api, so the
// customer estimate and the price staff confirm in admin stay equal.
const TIERS = [
  { minSlots: 2, discountPercent: 5, flatDiscount: 0 },
  { minSlots: 3, discountPercent: 10, flatDiscount: 0 },
  { minSlots: 4, discountPercent: 30, flatDiscount: 0 },
];
const ROOM_1 = [['09:30', 189000], ['13:00', 189000], ['16:30', 189000], ['20:00', 319000]];
const daySlot = (day, index) => slot({
  key: `${day}-${index}`, slotId: `slot-${index}`, date: `2026-09-${String(19 + day).padStart(2, '0')}`,
  startTime: ROOM_1[index][0], price: ROOM_1[index][1], isOvernight: index === 3,
});
// Linear positions across days: 0-3 are day one, 4-7 day two, and so on.
const pick = (...positions) => positions.map(p => daySlot(Math.floor(p / 4), p % 4));
const combo = (slots, tiers = TIERS) => price([], slots, { comboDiscounts: tiers });

test('combo restarts after every four slots booked from the first slot', () => {
  const totals = [189000, 359100, 510300, 620200, 809200, 979300, 1130500, 1240400];
  totals.forEach((total, i) => {
    assert.equal(combo(pick(...Array.from({ length: i + 1 }, (_, p) => p))).totalAmount, total, `${i + 1} slots`);
  });
});

test('combo cycle starts at the first booked slot, not at the start of the day', () => {
  const result = combo(pick(1, 2, 3, 4, 5));
  assert.equal(result.comboDiscountAmount, 265800);
  assert.equal(result.totalAmount, 809200);
  assert.deepEqual(result.comboCycles.map(c => [c.slotCount, c.percent]), [[4, 30], [1, 0]]);
});

test('overnight slot and the next morning get the two-slot tier', () => {
  assert.equal(combo(pick(3, 4)).totalAmount, 482600);
});

test('slots are counted in date and start-time order, not selection order', () => {
  assert.equal(combo(pick(5, 4, 3, 2, 1)).comboDiscountAmount, 265800);
});

test('longer bookings get one combo per full cycle and a tier for the leftover', () => {
  assert.equal(combo(pick(...Array.from({ length: 10 }, (_, p) => p))).comboDiscountAmount, 2 * 265800 + 18900);
  assert.equal(combo(pick(...Array.from({ length: 12 }, (_, p) => p))).comboDiscountAmount, 3 * 265800);
});

test('flat combo discount is given once per cycle', () => {
  const tiers = [TIERS[0], { minSlots: 4, discountPercent: 30, flatDiscount: 50000 }];
  assert.equal(combo(pick(0, 1, 2, 3, 4, 5, 6, 7), tiers).comboDiscountAmount, 2 * (265800 + 50000));
});

test('no combo tiers means no combo discount', () => {
  const result = combo(pick(0, 1, 2, 3, 4), []);
  assert.equal(result.comboDiscountAmount, 0);
  assert.deepEqual(result.comboCycles, []);
});

test('combo label shows every booked slot and the percent off the base price', () => {
  assert.equal(getComboDiscountDetail(combo(pick(0, 1))), '2 khung -5%');
  assert.equal(getComboDiscountDetail(combo(pick(0, 1, 2, 3))), '4 khung -30%');
  // 265.800đ off 1.075.000đ is 24,7%.
  assert.equal(getComboDiscountDetail(combo(pick(0, 1, 2, 3, 4))), '5 khung -25%');
  // 284.700đ off 1.264.000đ is 22,5%.
  assert.equal(getComboDiscountDetail(combo(pick(0, 1, 2, 3, 4, 5))), '6 khung -23%');
  assert.equal(getComboDiscountDetail(combo(pick(0, 1, 2, 3, 4, 5, 6, 7))), '8 khung -30%');
  assert.equal(getComboDiscountDetail(combo(pick(0))), '');
  assert.equal(getSavingsBadgeLabel(combo(pick(0, 1, 2, 3, 4))), 'Combo 5 khung -25%');
  assert.equal(getSavingsBadgeLabel(combo(pick(0, 1, 2, 3, 4, 5))), 'Combo 6 khung -23%');
});

// WEEKDAY_SLOT: same scenario as WeekdaySlotCampaignTest in brill-home-api. Monday to
// Thursday every slot is discounted, Friday only the day slots.
const THURSDAY = '2026-09-17';
const FRIDAY = '2026-09-18';
const SATURDAY = '2026-09-19';
const weekdaySlot = (overrides = {}) => campaign({
  id: 'weekday-slot', name: 'Weekday slot', type: 'WEEKDAY_SLOT',
  discountType: 'FIXED_AMOUNT', discountValue: 20000,
  targetRoomId: null, targetWeekDay: null, targetOvernightSlot: null,
  targetWeekDays: [5], targetRoomIds: ['room-a'],
  ...overrides,
});
const ownerRules = [
  weekdaySlot({ id: 'mon-thu', targetWeekDays: [1, 2, 3, 4] }),
  weekdaySlot({ id: 'fri-day', targetWeekDays: [5], targetOvernightSlot: false }),
];
const discountOn = (programs, date, isOvernight) =>
  price(programs, [slot({ key: `${date}-${isOvernight}`, date, isOvernight })]).programDiscountAmount;

test('weekday slot rules leave the Friday overnight slot at full price', () => {
  assert.equal(discountOn(ownerRules, THURSDAY, true), 20000);
  assert.equal(discountOn(ownerRules, FRIDAY, false), 20000);
  assert.equal(discountOn(ownerRules, FRIDAY, true), 0);
  assert.equal(discountOn(ownerRules, SATURDAY, false), 0);
});

test('weekday slot rules without rooms cover every room, with rooms only those', () => {
  assert.equal(discountOn([weekdaySlot({ targetRoomIds: ['room-b'] })], FRIDAY, false), 0);
  assert.equal(discountOn([weekdaySlot({ targetRoomIds: [] })], FRIDAY, false), 20000);
  assert.equal(discountOn([weekdaySlot({ targetRoomIds: null, targetOvernightSlot: true })], FRIDAY, true), 20000);
});

test('weekday slot outranks older types, and chosen rooms outrank every room', () => {
  const older = campaign({ id: 'old', targetWeekDay: true, discountValue: 90 });
  assert.equal(discountOn([older, weekdaySlot({ targetRoomIds: null, discountValue: 30000 })], FRIDAY, false), 30000);
  assert.equal(discountOn([
    weekdaySlot({ id: 'every-room', targetRoomIds: null, discountValue: 50000 }),
    weekdaySlot({ id: 'room-a-only', discountValue: 10000 }),
  ], FRIDAY, false), 10000);
});

test('weekday lists read as day ranges', () => {
  assert.equal(formatCampaignWeekDays([1, 2, 3, 4]), 'Thứ 2–Thứ 5');
  assert.equal(formatCampaignWeekDays([5]), 'Thứ 6');
  assert.equal(formatCampaignWeekDays([7, 6]), 'Thứ 7, CN');
  assert.equal(formatCampaignWeekDays([1, 3, 4, 5]), 'Thứ 2, Thứ 4–Thứ 6');
  assert.equal(formatCampaignWeekDays([1, 2, 3, 4, 5, 6, 7]), 'Cả tuần');
});

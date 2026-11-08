import assert from 'node:assert/strict';
import test from 'node:test';
import { calculatePricing, getCampaignDiscountBadge, getComboDiscountDetail, getSavingsBadgeLabel } from '../src/lib/pricingUtils.ts';

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

test('combo labels list each discounted cycle', () => {
  assert.equal(getComboDiscountDetail(combo(pick(0, 1, 2, 3, 4))), '4 khung -30%');
  assert.equal(getComboDiscountDetail(combo(pick(0, 1, 2, 3, 4, 5))), '4 khung -30%, 2 khung -5%');
  assert.equal(getComboDiscountDetail(combo(pick(0, 1, 2, 3, 4, 5, 6, 7))), '4 khung -30% ×2');
  assert.equal(getComboDiscountDetail(combo(pick(0))), '');
  assert.equal(getSavingsBadgeLabel(combo(pick(0, 1, 2, 3, 4))), 'Combo 4 khung -30%');
  assert.equal(getSavingsBadgeLabel(combo(pick(0, 1, 2, 3, 4, 5))), 'Combo - Tiết kiệm 285k');
});

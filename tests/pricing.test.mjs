import assert from 'node:assert/strict';
import test from 'node:test';
import { calculatePricing, getCampaignDiscountBadge } from '../src/lib/pricingUtils.ts';

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

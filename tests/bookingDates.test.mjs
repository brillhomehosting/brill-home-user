import assert from 'node:assert/strict';
import test from 'node:test';
import { buildBookingDateKeys, parseDateKey, splitIntoWindows, toDateKey } from '../src/lib/bookingDates.ts';

const API_MAX_WINDOW_DAYS = 100;
const at = (hour) => new Date(2026, 10, 1, hour, 30);
const dayGap = (from, to) => Math.round((parseDateKey(to) - parseDateKey(from)) / 86_400_000);

test('yesterday row is included before 19:00 only', () => {
  assert.equal(buildBookingDateKeys(at(18), 30)[0], '2026-10-31');
  assert.equal(buildBookingDateKeys(at(19), 30)[0], '2026-11-01');
});

test('the last date is today plus the configured maximum', () => {
  const keys = buildBookingDateKeys(at(10), 900);
  assert.equal(keys.at(-1), '2029-04-19');
  assert.equal(keys.length, 902);
});

test('dates run across month and year boundaries without gaps', () => {
  const keys = buildBookingDateKeys(at(10), 900);
  for (let index = 1; index < keys.length; index++) {
    assert.equal(dayGap(keys[index - 1], keys[index]), 1);
  }
});

test('date keys round-trip through local time', () => {
  for (const key of ['2026-11-01', '2027-01-01', '2028-02-29']) {
    assert.equal(toDateKey(parseDateKey(key)), key);
  }
});

test('windows cover every date in order and stay within the API limit', () => {
  const keys = buildBookingDateKeys(at(10), 900);
  const windows = splitIntoWindows(keys);
  assert.equal(windows[0].rowCount, 14);
  assert.equal(windows.reduce((total, window) => total + window.rowCount, 0), keys.length);
  assert.equal(windows[0].startDate, keys[0]);
  assert.equal(windows.at(-1).endDate, keys.at(-1));
  for (const window of windows) {
    assert.ok(dayGap(window.startDate, window.endDate) + 1 <= API_MAX_WINDOW_DAYS);
  }
  for (let index = 1; index < windows.length; index++) {
    assert.equal(dayGap(windows[index - 1].endDate, windows[index].startDate), 1);
  }
});

test('a short calendar still produces one complete window', () => {
  const windows = splitIntoWindows(buildBookingDateKeys(at(10), 3));
  assert.equal(windows.length, 1);
  assert.equal(windows[0].rowCount, 5);
});

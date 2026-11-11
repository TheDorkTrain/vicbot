const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createTierList, getResetDateKey, TIER_NAMES } = require('../tierList');

function createTempFilePath() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vicbot-tier-list-'));
  return {
    filePath: path.join(directory, 'tier-list.json'),
    cleanup: () => fs.rmSync(directory, { recursive: true, force: true }),
  };
}

function fakeTimer() {
  return {
    scheduleTimeout: (callback) => ({ callback, unref() {} }),
    clearScheduledTimeout() {},
  };
}

test('uses local 2am as the daily reset boundary', () => {
  assert.equal(getResetDateKey(new Date(2026, 10, 11, 1, 59)), '2026-11-10');
  assert.equal(getResetDateKey(new Date(2026, 10, 11, 2, 0)), '2026-11-11');
});

test('inserts items at random positions and reports their neighboring placements', (t) => {
  const tempFile = createTempFilePath();
  t.after(tempFile.cleanup);

  const placements = [0, 0, 0, 0.99, 0, 0.5];
  const timer = fakeTimer();
  const tierList = createTierList({
    filePath: tempFile.filePath,
    now: () => new Date(2026, 10, 11, 12),
    random: () => placements.shift(),
    ...timer,
  });
  t.after(() => tierList.stop());

  const first = tierList.add('first');
  const second = tierList.add('second');
  const middle = tierList.add('middle');

  assert.deepEqual(first, { tier: 'S Tier', higher: null, lower: null });
  assert.deepEqual(second, { tier: 'S Tier', higher: 'first', lower: null });
  assert.deepEqual(middle, { tier: 'S Tier', higher: 'first', lower: 'second' });
  assert.deepEqual(tierList.getTiers()['S Tier'], ['first', 'middle', 'second']);
});

test('clears all tiers at 2am and persists the new daily list', (t) => {
  const tempFile = createTempFilePath();
  t.after(tempFile.cleanup);

  let currentTime = new Date(2026, 10, 11, 1, 59);
  const timer = fakeTimer();
  const tierList = createTierList({
    filePath: tempFile.filePath,
    now: () => currentTime,
    random: () => 0,
    ...timer,
  });
  t.after(() => tierList.stop());
  tierList.add('yesterday');

  currentTime = new Date(2026, 10, 11, 2, 0);

  assert.deepEqual(tierList.getTiers(), Object.fromEntries(TIER_NAMES.map((tier) => [tier, []])));
  assert.equal(JSON.parse(fs.readFileSync(tempFile.filePath, 'utf8')).resetDate, '2026-11-11');
});

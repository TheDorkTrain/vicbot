const fs = require('node:fs');
const path = require('node:path');

const TIER_NAMES = ['S Tier', 'A Tier', 'B Tier', 'C Tier', 'D Tier', 'Trash Tier'];
const RESET_HOUR = 2;

function getResetDateKey(date) {
  const resetDate = new Date(date);
  if (resetDate.getHours() < RESET_HOUR) {
    resetDate.setDate(resetDate.getDate() - 1);
  }

  const year = resetDate.getFullYear();
  const month = String(resetDate.getMonth() + 1).padStart(2, '0');
  const day = String(resetDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createEmptyTiers() {
  return Object.fromEntries(TIER_NAMES.map((tier) => [tier, []]));
}

function createTierList({
  filePath = path.join(__dirname, 'data', 'vicTierList.json'),
  now = () => new Date(),
  random = Math.random,
  scheduleTimeout = setTimeout,
  clearScheduledTimeout = clearTimeout,
} = {}) {
  let state;
  let resetTimer;

  function save() {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const temporaryFilePath = `${filePath}.tmp`;
    fs.writeFileSync(temporaryFilePath, `${JSON.stringify(state, null, 2)}\n`);
    fs.renameSync(temporaryFilePath, filePath);
  }

  function resetIfNeeded() {
    const resetDate = getResetDateKey(now());
    if (state.resetDate !== resetDate) {
      state = { resetDate, tiers: createEmptyTiers() };
      save();
    }
  }

  function scheduleReset() {
    const currentTime = now();
    const nextReset = new Date(currentTime);
    nextReset.setHours(RESET_HOUR, 0, 0, 0);
    if (nextReset <= currentTime) {
      nextReset.setDate(nextReset.getDate() + 1);
    }

    resetTimer = scheduleTimeout(() => {
      resetIfNeeded();
      scheduleReset();
    }, nextReset.getTime() - currentTime.getTime());
    resetTimer.unref?.();
  }

  if (fs.existsSync(filePath)) {
    state = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (
      !state
      || typeof state.resetDate !== 'string'
      || !state.tiers
      || !TIER_NAMES.every((tier) => Array.isArray(state.tiers[tier]))
    ) {
      throw new Error(`Invalid tier-list data in ${filePath}`);
    }
  } else {
    state = { resetDate: getResetDateKey(now()), tiers: createEmptyTiers() };
    save();
  }

  resetIfNeeded();
  scheduleReset();

  return {
    add(item, requestedTier) {
      resetIfNeeded();
      const tier = requestedTier || TIER_NAMES[Math.floor(random() * TIER_NAMES.length)];
      if (!TIER_NAMES.includes(tier)) {
        throw new Error(`Unknown tier: ${tier}`);
      }
      const entries = state.tiers[tier];
      const placement = Math.floor(random() * (entries.length + 1));
      entries.splice(placement, 0, item);
      save();

      return {
        tier,
        higher: entries[placement - 1] || null,
        lower: entries[placement + 1] || null,
      };
    },
    getTiers() {
      resetIfNeeded();
      return Object.fromEntries(TIER_NAMES.map((tier) => [tier, [...state.tiers[tier]]]));
    },
    stop() {
      clearScheduledTimeout(resetTimer);
    },
  };
}

module.exports = { TIER_NAMES, createTierList, getResetDateKey };

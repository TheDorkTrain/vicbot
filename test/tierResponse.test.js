const test = require('node:test');
const assert = require('node:assert/strict');
const { createTierResponse, TIER_GROUPS } = require('../tierResponse');

const responses = {
  reject: ['nope'],
  intro: ['intro'],
  best: ['best lead'],
  good: ['good lead'],
  mid: ['mid lead'],
  worst: ['worst lead'],
};

test('rejects about one in twenty requests without adding an item', () => {
  let additions = 0;
  const values = [0, 0];
  const result = createTierResponse({
    item: 'something',
    tierList: { add: () => { additions += 1; } },
    responses,
    random: () => values.shift(),
  });

  assert.deepEqual(result, { rejected: true, content: 'nope' });
  assert.equal(additions, 0);
});

test('uses the lead-in category to select an allowed tier and starts with an intro', () => {
  const values = [0.5, 0.3, 0.9, 0, 0];
  let addedItem;
  let addedTier;
  const result = createTierResponse({
    item: 'peanut butter sandwiches',
    tierList: {
      add(item, tier) {
        addedItem = item;
        addedTier = tier;
        return { higher: 'toast', lower: 'cereal' };
      },
    },
    responses,
    random: () => values.shift(),
  });

  assert.equal(addedItem, 'peanut butter sandwiches');
  assert.ok(TIER_GROUPS.good.includes(addedTier));
  assert.equal(result.rejected, false);
  assert.match(result.content, /^intro good lead!/);
  assert.match(result.content, /lands in [AB] Tier\./);
  assert.match(result.content, /above cereal and below toast\./);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { createTierResponse, extractTierItem, getForcedTier, TIER_GROUPS } = require('../tierResponse');

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

test('extracts tier items from the supported question and rank phrasings', () => {
  const examples = [
    ['Vic what do you think about peanut butter?', 'peanut butter?'],
    ['Vic, what do you think of pizza', 'pizza'],
    ['Vic what is your opinion on this movie', 'this movie'],
    ["Vic, what's your opinion about this movie?", 'this movie?'],
    ['Vic rank: these tacos', 'these tacos'],
    ['Vic rank chocolate', 'chocolate'],
  ];

  for (const [prompt, expectedItem] of examples) {
    assert.equal(extractTierItem(prompt), expectedItem);
  }
  assert.equal(extractTierItem('Vic, what do you think?'), null);
});

test('extracts items from the seven additional opinion phrasings with or without a comma', () => {
  const examples = [
    ['Vic how do you feel about pineapple pizza?', 'pineapple pizza?'],
    ['Vic, what are your thoughts on this movie?', 'this movie?'],
    ['Vic give me your take on these tacos', 'these tacos'],
    ['Vic, do you like jazz?', 'jazz?'],
    ['Vic how would you rate this game', 'this game'],
    ['Vic, where would you rank this book?', 'this book?'],
    ['Vic is this sandwich any good?', 'this sandwich'],
  ];

  for (const [prompt, expectedItem] of examples) {
    assert.equal(extractTierItem(prompt), expectedItem);
  }
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

test('automatically assigns configured prefix matches to their forced tiers', () => {
  for (const item of ["Gabby's cooking", 'Gabs are great', 'Gabber stream']) {
    assert.equal(getForcedTier(item), 'S Tier');
  }
  for (const item of ['Trump again', 'Republicans today', 'JD Vance said', 'Nazis', 'Hitler', 'Racism in games']) {
    assert.equal(getForcedTier(item), 'Trash Tier');
  }

  assert.equal(getForcedTier('the Gabber show'), null);
  assert.equal(getForcedTier('Trumpet music'), null);
});

test('places Gabber-authored Me and My phrases in S Tier without rejecting them', () => {
  const assignedTiers = [];
  const values = [0.999, 0, 0, 0];
  const tierList = {
    add(item, tier) {
      assignedTiers.push(tier);
      return { higher: null, lower: null };
    },
  };

  const meResult = createTierResponse({
    item: 'Me',
    tierList,
    responses,
    isGabber: true,
    random: () => values.shift(),
  });
  const myResult = createTierResponse({
    item: 'My favorite thing',
    tierList,
    responses,
    isGabber: true,
    random: () => values.shift(),
  });

  assert.deepEqual(assignedTiers, ['S Tier', 'S Tier']);
  assert.equal(meResult.rejected, false);
  assert.equal(myResult.rejected, false);
  assert.equal(getForcedTier('Me', { isGabber: false }), null);
});

test('forced tier phrases bypass rejection and trash keywords take priority', () => {
  const assignedTiers = [];
  const result = createTierResponse({
    item: 'Trump is an automatic trash-tier entry',
    tierList: {
      add(item, tier) {
        assignedTiers.push(tier);
        return { higher: null, lower: null };
      },
    },
    responses,
    random: () => 0,
  });

  assert.deepEqual(assignedTiers, ['Trash Tier']);
  assert.equal(result.rejected, false);
});

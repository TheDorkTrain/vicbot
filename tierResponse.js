const TIER_GROUPS = {
  best: ['S Tier'],
  good: ['A Tier', 'B Tier'],
  mid: ['C Tier', 'D Tier'],
  worst: ['Trash Tier'],
};

const S_TIER_PREFIXES = ['gabby', 'gabs', 'gabber', 'artemis', 'penny', 'tinkaton', 'vic', 'very important people'];
const TRASH_TIER_PREFIXES = ['sam reich', 'gamechanger', 'trump', 'donald trump', 'republicans', 'jd vance', 'nazis', 'hitler', 'racism', 'transphobia', 'sexism', 'ableism', 'misogyny', 'bigotry', 'racist', "racists", 'nazi', 'fascist', 'white supremacist'];

function startsWithAnyPrefix(item, prefixes) {
  const normalizedItem = item.trim().toLowerCase().replace(/[’‘]/g, "'");
  return prefixes.some((prefix) => {
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`^${escapedPrefix}(?:'s)?(?:$|[\\s\\p{P}\\p{S}])`, 'u').test(normalizedItem);
  });
}

function getForcedTier(item, { isGabber = false } = {}) {
  if (startsWithAnyPrefix(item, TRASH_TIER_PREFIXES)) return 'Trash Tier';
  if (startsWithAnyPrefix(item, S_TIER_PREFIXES)) return 'S Tier';

  if (isGabber) {
    const normalizedItem = item.trim().toLowerCase();
    if (normalizedItem === 'me' || /^my(?:\b|')/i.test(normalizedItem)) return 'S Tier';
  }

  return null;
}

function createTierResponse({ item, tierList, responses, random = Math.random, isGabber = false }) {
  const forcedTier = getForcedTier(item, { isGabber });
  if (!forcedTier && random() < 1 / 20) {
    return {
      rejected: true,
      content: responses.reject[Math.floor(random() * responses.reject.length)],
    };
  }

  const group = forcedTier
    ? (forcedTier === 'S Tier' ? 'best' : 'worst')
    : Object.keys(TIER_GROUPS)[Math.floor(random() * Object.keys(TIER_GROUPS).length)];
  const tiers = TIER_GROUPS[group];
  const tier = forcedTier || tiers[Math.floor(random() * tiers.length)];
  const placement = tierList.add(item, tier);
  const intro = responses.intro[Math.floor(random() * responses.intro.length)];
  const leadIn = responses[group][Math.floor(random() * responses[group].length)];
  const displayItem = item.length > 300 ? `${item.slice(0, 297)}...` : item;
  const context = [];

  if (placement.lower) {
    const lower = placement.lower.length > 300 ? `${placement.lower.slice(0, 297)}...` : placement.lower;
    context.push(`above ${lower}`);
  }
  if (placement.higher) {
    const higher = placement.higher.length > 300 ? `${placement.higher.slice(0, 297)}...` : placement.higher;
    context.push(`below ${higher}`);
  }

  const comparison = context.length
    ? `It's ${context.join(' and ')}.`
    : '';
  return {
    rejected: false,
    content: `${intro} ${leadIn}! ${displayItem} lands in ${tier}. ${comparison}`,
  };
}

module.exports = { createTierResponse, getForcedTier, TIER_GROUPS };

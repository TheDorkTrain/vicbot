const TIER_GROUPS = {
  best: ['S Tier'],
  good: ['A Tier', 'B Tier'],
  mid: ['C Tier', 'D Tier'],
  worst: ['Trash Tier'],
};

function createTierResponse({ item, tierList, responses, random = Math.random }) {
  if (random() < 1 / 20) {
    return {
      rejected: true,
      content: responses.reject[Math.floor(random() * responses.reject.length)],
    };
  }

  const group = Object.keys(TIER_GROUPS)[Math.floor(random() * Object.keys(TIER_GROUPS).length)];
  const tiers = TIER_GROUPS[group];
  const tier = tiers[Math.floor(random() * tiers.length)];
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
    : 'It is the first entry in this tier.';
  return {
    rejected: false,
    content: `${intro} ${leadIn}! ${displayItem} lands in ${tier}. ${comparison}`,
  };
}

module.exports = { createTierResponse, TIER_GROUPS };

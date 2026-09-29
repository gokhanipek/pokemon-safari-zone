import {
  BLIND_SPOT,
  SPEED_ROUND,
  CHAOS,
  MODIFIER_IDS,
  isModifier,
  modifierTierValue,
  isStrongerTier,
  blindSpotRevealSeconds,
  reshuffleUnclaimed,
} from './modifiers';

function pos(cardId, name, extra = {}) {
  return { cardId, name, faceUp: false, claimedBy: null, ...extra };
}

describe('modifier catalog', () => {
  it('exposes the three modifiers', () => {
    expect(MODIFIER_IDS).toEqual([BLIND_SPOT, SPEED_ROUND, CHAOS]);
    expect(isModifier(BLIND_SPOT)).toBe(true);
    expect(isModifier('nope')).toBe(false);
  });

  // match-modifiers: "Blind Spot tier values"
  it('Blind Spot tiers 1/2/3 return 0.7/0.5/0.3 seconds', () => {
    expect(modifierTierValue(BLIND_SPOT, 1)).toBe(0.7);
    expect(modifierTierValue(BLIND_SPOT, 2)).toBe(0.5);
    expect(modifierTierValue(BLIND_SPOT, 3)).toBe(0.3);
    expect(blindSpotRevealSeconds(3)).toBe(0.3);
  });

  // match-modifiers: "Tier 3 is strongest"
  it('higher tier is stronger regardless of value direction', () => {
    expect(isStrongerTier(3, 1)).toBe(true);
    expect(isStrongerTier(2, 3)).toBe(false);
    expect(isStrongerTier(2, 2)).toBe(false);
  });

  it('clamps out-of-range tiers', () => {
    expect(modifierTierValue(BLIND_SPOT, 0)).toBe(0.7);
    expect(modifierTierValue(BLIND_SPOT, 9)).toBe(0.3);
  });
});

describe('reshuffleUnclaimed (Chaos effect)', () => {
  // match-modifiers: "Unclaimed cards are reshuffled"
  it('leaves claimed positions unchanged and preserves unclaimed names as a multiset', () => {
    const grid = [
      pos(0, 'pikachu', { claimedBy: 'player' }),
      pos(1, 'pikachu', { claimedBy: 'player' }),
      pos(2, 'eevee'),
      pos(3, 'onix'),
      pos(4, 'eevee'),
      pos(5, 'onix'),
    ];
    const next = reshuffleUnclaimed(grid);

    // claimed positions untouched
    expect(next[0]).toEqual(grid[0]);
    expect(next[1]).toEqual(grid[1]);

    // cardIds preserved everywhere
    expect(next.map((p) => p.cardId)).toEqual([0, 1, 2, 3, 4, 5]);

    // unclaimed names preserved as a multiset
    const unclaimedNames = next
      .filter((p) => p.claimedBy === null)
      .map((p) => p.name)
      .sort();
    expect(unclaimedNames).toEqual(['eevee', 'eevee', 'onix', 'onix']);
  });

  it('resets any face-up unclaimed card to face-down', () => {
    const grid = [pos(0, 'eevee', { faceUp: true }), pos(1, 'eevee')];
    const next = reshuffleUnclaimed(grid);
    next.forEach((p) => expect(p.faceUp).toBe(false));
  });

  it('does not mutate the input grid', () => {
    const grid = [pos(0, 'eevee'), pos(1, 'onix')];
    const copy = JSON.parse(JSON.stringify(grid));
    reshuffleUnclaimed(grid);
    expect(grid).toEqual(copy);
  });
});

import {
  cardValue, scoreClaimedNames, DEFAULT_CARD_VALUE,
  modifierPrice, cardPrice, MODIFIER_PRICE,
} from './economy';

describe('economy card values', () => {
  it('returns the configured value for known Pokemon', () => {
    expect(cardValue('pikachu')).toBe(5);
    expect(cardValue('snorlax')).toBe(6);
  });

  it('falls back to the default for unknown Pokemon', () => {
    expect(cardValue('mewtwo')).toBe(DEFAULT_CARD_VALUE);
  });

  it('sums claimed names', () => {
    expect(scoreClaimedNames(['pikachu', 'snorlax'])).toBe(11);
    expect(scoreClaimedNames([])).toBe(0);
    expect(scoreClaimedNames(undefined)).toBe(0);
  });
});

describe('marketplace pricing', () => {
  it('tier-1 modifier price equals the prior fixed price', () => {
    expect(modifierPrice(1)).toBe(MODIFIER_PRICE);
  });

  it('higher modifier tiers cost more', () => {
    expect(modifierPrice(2)).toBeGreaterThan(modifierPrice(1));
    expect(modifierPrice(3)).toBeGreaterThan(modifierPrice(2));
  });

  it('clamps modifier tier for pricing', () => {
    expect(modifierPrice(0)).toBe(modifierPrice(1));
    expect(modifierPrice(9)).toBe(modifierPrice(3));
  });

  it('card price is positive and derived from value', () => {
    expect(cardPrice('pikachu')).toBeGreaterThan(0);
    expect(cardPrice('snorlax')).toBeGreaterThan(cardPrice('jigglypuff'));
  });
});

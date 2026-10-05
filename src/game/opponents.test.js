import { getOpponents, getOpponentById } from './opponents';
import { deckToCards, MAX_DISTINCT, COPIES_PER_POKEMON } from './deck';

describe('opponent roster', () => {
  it('has at least two opponents', () => {
    expect(getOpponents().length).toBeGreaterThanOrEqual(2);
  });

  it('every opponent deck satisfies the 5-distinct / 10-card constraint', () => {
    getOpponents().forEach((o) => {
      expect(o.deck.pokemon).toHaveLength(MAX_DISTINCT);
      expect(new Set(o.deck.pokemon).size).toBe(MAX_DISTINCT); // distinct
      expect(deckToCards(o.deck)).toHaveLength(MAX_DISTINCT * COPIES_PER_POKEMON);
    });
  });

  it('every opponent has a name and id', () => {
    getOpponents().forEach((o) => {
      expect(typeof o.id).toBe('string');
      expect(typeof o.name).toBe('string');
    });
  });

  it('looks up by id', () => {
    const first = getOpponents()[0];
    expect(getOpponentById(first.id)).toBe(first);
    expect(getOpponentById('nope')).toBeNull();
  });
});

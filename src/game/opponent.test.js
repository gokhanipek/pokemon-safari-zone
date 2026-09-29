import {
  flippablePositions,
  chooseOpponentFlip,
  rememberCard,
} from './opponent';

function pos(cardId, name, extra = {}) {
  return { cardId, name, faceUp: false, claimedBy: null, ...extra };
}

describe('flippablePositions', () => {
  it('excludes claimed, face-up, and already-flipped-this-turn cards', () => {
    const state = {
      grid: [
        pos(0, 'pikachu', { claimedBy: 'player' }),
        pos(1, 'eevee', { faceUp: true }),
        pos(2, 'onix'),
        pos(3, 'onix'),
      ],
      flippedThisTurn: [2],
    };
    const available = flippablePositions(state);
    const ids = available.map((p) => p.cardId);
    expect(ids).toEqual([3]);
  });
});

describe('chooseOpponentFlip', () => {
  it('returns null when nothing is flippable', () => {
    const state = {
      grid: [pos(0, 'pikachu', { claimedBy: 'opponent' })],
      flippedThisTurn: [],
    };
    expect(chooseOpponentFlip(state, {})).toBeNull();
  });

  it('completes a known pair on the second pick', () => {
    const state = {
      grid: [pos(0, 'pikachu', { faceUp: true }), pos(1, 'pikachu'), pos(2, 'eevee')],
      flippedThisTurn: [0],
    };
    // opponent has seen that card 1 is pikachu
    const seen = { 1: 'pikachu', 2: 'eevee' };
    expect(chooseOpponentFlip(state, seen)).toBe(1);
  });

  it('opens a known pair on the first pick when both are remembered', () => {
    const state = {
      grid: [pos(0, 'onix'), pos(1, 'onix'), pos(2, 'eevee')],
      flippedThisTurn: [],
    };
    const seen = { 0: 'onix', 1: 'onix' };
    expect(chooseOpponentFlip(state, seen)).toBe(0);
  });

  it('falls back to an available card when nothing is known', () => {
    const state = {
      grid: [pos(0, 'onix'), pos(1, 'eevee')],
      flippedThisTurn: [],
    };
    const choice = chooseOpponentFlip(state, {});
    expect([0, 1]).toContain(choice);
  });
});

describe('rememberCard', () => {
  it('records a card without mutating the prior memory', () => {
    const before = {};
    const after = rememberCard(before, { cardId: 5, name: 'snorlax' });
    expect(after).toEqual({ 5: 'snorlax' });
    expect(before).toEqual({});
  });
});

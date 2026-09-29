import {
  flippablePositions,
  chooseOpponentFlip,
  rememberCard,
  memoryCapacity,
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

  it('is unbounded when no capacity is given', () => {
    let seen = {};
    for (let i = 0; i < 6; i += 1) {
      seen = rememberCard(seen, { cardId: i, name: `p${i}` });
    }
    expect(Object.keys(seen)).toHaveLength(6);
  });

  it('bounds the memory to the given capacity, keeping the just-seen card', () => {
    let seen = { 0: 'a', 1: 'b', 2: 'c' };
    seen = rememberCard(seen, { cardId: 9, name: 'z' }, 2);
    expect(Object.keys(seen)).toHaveLength(2);
    expect(seen[9]).toBe('z'); // the just-seen card survives
  });

  it('remembers nothing at capacity 0', () => {
    const seen = rememberCard({ 0: 'a' }, { cardId: 1, name: 'b' }, 0);
    expect(seen).toEqual({});
  });

  it('keeps a card already within capacity', () => {
    const seen = rememberCard({ 3: 'x' }, { cardId: 4, name: 'y' }, 4);
    expect(seen).toEqual({ 3: 'x', 4: 'y' });
  });
});

describe('memoryCapacity', () => {
  it('adds difficulty level and modifier tier', () => {
    expect(memoryCapacity(0, 1)).toBe(1); // easy vs a tier-1 modifier
    expect(memoryCapacity(1, 2)).toBe(3); // normal vs a tier-2 modifier
    expect(memoryCapacity(2, 2)).toBe(4); // hard vs a tier-2 modifier
  });

  it('treats a missing modifier tier as 0', () => {
    expect(memoryCapacity(1)).toBe(1);
    expect(memoryCapacity(0, null)).toBe(0);
  });

  it('never returns a negative capacity', () => {
    expect(memoryCapacity(-5, 0)).toBe(0);
  });
});

import { chooseOpponentModifierTrigger } from './opponent';

function turnState(overrides = {}) {
  return {
    activePlayer: 'opponent',
    phase: 'awaitingFirst',
    flippedThisTurn: [],
    claimedPairs: { player: 0, opponent: 0 },
    ...overrides,
  };
}

describe('chooseOpponentModifierTrigger (4.1)', () => {
  it('never triggers without a modifier or after already triggered', () => {
    expect(chooseOpponentModifierTrigger(turnState(), null, false)).toBe(false);
    expect(
      chooseOpponentModifierTrigger(turnState(), { id: 'blindSpot', tier: 1 }, true)
    ).toBe(false);
  });

  it('only triggers on the opponent turn at a fresh boundary', () => {
    const mod = { id: 'speedRound', tier: 1 };
    expect(chooseOpponentModifierTrigger(turnState({ activePlayer: 'player' }), mod, false)).toBe(false);
    expect(chooseOpponentModifierTrigger(turnState({ phase: 'resolving' }), mod, false)).toBe(false);
    expect(chooseOpponentModifierTrigger(turnState({ flippedThisTurn: [1] }), mod, false)).toBe(false);
    expect(chooseOpponentModifierTrigger(turnState(), mod, false)).toBe(true);
  });

  it('fires opponent-next-turn modifiers (Blind Spot) at the boundary', () => {
    expect(
      chooseOpponentModifierTrigger(turnState(), { id: 'blindSpot', tier: 2 }, false)
    ).toBe(true);
  });

  it('fires Chaos only when trailing', () => {
    const chaos = { id: 'chaos', tier: 1 };
    // trailing -> fire
    expect(
      chooseOpponentModifierTrigger(turnState({ claimedPairs: { player: 3, opponent: 1 } }), chaos, false)
    ).toBe(true);
    // not trailing -> hold
    expect(
      chooseOpponentModifierTrigger(turnState({ claimedPairs: { player: 1, opponent: 2 } }), chaos, false)
    ).toBe(false);
  });
});

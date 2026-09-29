import {
  createMatch,
  canFlip,
  flip,
  resolve,
  matchOutcome,
} from './matchMachine';

// Build a deterministic state by hand so we control card positions.
function stateFromGrid(grid, overrides = {}) {
  return {
    grid,
    activePlayer: 'player',
    phase: 'awaitingFirst',
    flippedThisTurn: [],
    claimedPairs: { player: 0, opponent: 0 },
    lastOutcome: null,
    ...overrides,
  };
}

function pos(cardId, name, extra = {}) {
  return { cardId, name, faceUp: false, claimedBy: null, ...extra };
}

describe('createMatch', () => {
  it('starts with player active, awaitingFirst, zero claims', () => {
    const s = createMatch(
      { pokemon: ['pikachu', 'bulbasaur', 'charmander', 'squirtle', 'jigglypuff'] },
      { pokemon: ['eevee', 'psyduck', 'snorlax', 'onix', 'gyarados'] }
    );
    expect(s.grid).toHaveLength(20);
    expect(s.activePlayer).toBe('player');
    expect(s.phase).toBe('awaitingFirst');
    expect(s.claimedPairs).toEqual({ player: 0, opponent: 0 });
  });
});

describe('flip / resolve - match keeps the turn', () => {
  // memory-duel: "Active player flips two cards", "Successful match"
  it('two matching flips claim the pair and keep the player active', () => {
    const grid = [
      pos(0, 'pikachu'),
      pos(1, 'pikachu'),
      pos(2, 'eevee'),
      pos(3, 'eevee'),
    ];
    let s = stateFromGrid(grid);

    s = flip(s, 0);
    expect(s.phase).toBe('awaitingSecond');
    expect(s.grid.find((p) => p.cardId === 0).faceUp).toBe(true);

    s = flip(s, 1);
    expect(s.phase).toBe('resolving');

    s = resolve(s);
    expect(s.lastOutcome).toBe('match');
    expect(s.claimedPairs.player).toBe(1);
    expect(s.activePlayer).toBe('player'); // keeps turn
    expect(s.phase).toBe('awaitingFirst');
    expect(s.grid.find((p) => p.cardId === 0).claimedBy).toBe('player');
    expect(s.grid.find((p) => p.cardId === 1).claimedBy).toBe('player');
  });
});

describe('flip / resolve - miss passes the turn', () => {
  // memory-duel: "Missed match passes the turn"
  it('two mismatched flips flip back and pass the turn', () => {
    const grid = [
      pos(0, 'pikachu'),
      pos(1, 'eevee'),
      pos(2, 'pikachu'),
      pos(3, 'eevee'),
    ];
    let s = stateFromGrid(grid);
    s = flip(s, 0);
    s = flip(s, 1);
    s = resolve(s);
    expect(s.lastOutcome).toBe('miss');
    expect(s.activePlayer).toBe('opponent'); // passed
    expect(s.grid.find((p) => p.cardId === 0).faceUp).toBe(false);
    expect(s.grid.find((p) => p.cardId === 1).faceUp).toBe(false);
    expect(s.claimedPairs).toEqual({ player: 0, opponent: 0 });
  });
});

describe('canFlip guards', () => {
  // memory-duel: "Input ignored on non-flippable positions"
  it('ignores already-claimed and already-face-up positions', () => {
    const grid = [
      pos(0, 'pikachu', { claimedBy: 'player' }),
      pos(1, 'pikachu', { faceUp: true }),
      pos(2, 'eevee'),
    ];
    const s = stateFromGrid(grid);
    expect(canFlip(s, 0)).toBe(false); // claimed
    expect(canFlip(s, 1)).toBe(false); // face-up
    expect(canFlip(s, 2)).toBe(true);
  });

  it('ignores flips while resolving', () => {
    const grid = [pos(0, 'pikachu'), pos(1, 'eevee')];
    const s = stateFromGrid(grid, { phase: 'resolving' });
    expect(canFlip(s, 0)).toBe(false);
    expect(flip(s, 0)).toBe(s); // unchanged
  });
});

describe('match ends when grid cleared', () => {
  // memory-duel: "Match ends and a winner is determined when the grid is cleared"
  it('sets phase ended and computes outcome', () => {
    // One pair left, already player leads 2-1 in prior claims
    const grid = [
      pos(0, 'pikachu'),
      pos(1, 'pikachu'),
      pos(2, 'eevee', { claimedBy: 'player' }),
      pos(3, 'eevee', { claimedBy: 'player' }),
      pos(4, 'onix', { claimedBy: 'opponent' }),
      pos(5, 'onix', { claimedBy: 'opponent' }),
    ];
    let s = stateFromGrid(grid, { claimedPairs: { player: 1, opponent: 1 } });
    s = flip(s, 0);
    s = flip(s, 1);
    s = resolve(s);
    expect(s.phase).toBe('ended');
    expect(s.claimedPairs).toEqual({ player: 2, opponent: 1 });
    expect(matchOutcome(s)).toBe('player');
  });
});

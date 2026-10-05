import {
  createMatch,
  canFlip,
  flip,
  resolve,
  matchOutcome,
  expireTurn,
  reshuffle,
  queueTurnEffect,
  DEFAULT_REVEAL_MS,
} from './matchMachine';

// Build a deterministic state by hand so we control card positions.
function stateFromGrid(grid, overrides = {}) {
  return {
    grid,
    activePlayer: 'player',
    phase: 'awaitingFirst',
    flippedThisTurn: [],
    claimedPairs: { player: 0, opponent: 0 },
    claimedNames: { player: [], opponent: [] },
    lastOutcome: null,
    defaultRevealMs: DEFAULT_REVEAL_MS,
    revealMs: DEFAULT_REVEAL_MS,
    turnLimitMs: null,
    pendingTurnEffect: null,
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

describe('claimed-name accounting (2.4)', () => {
  it('records the claimed Pokemon name for the claiming side', () => {
    const grid = [
      pos(0, 'pikachu'),
      pos(1, 'pikachu'),
      pos(2, 'eevee'),
      pos(3, 'eevee'),
    ];
    let s = stateFromGrid(grid);
    s = flip(s, 0);
    s = flip(s, 1);
    s = resolve(s);
    expect(s.claimedNames.player).toEqual(['pikachu']);
    expect(s.claimedNames.opponent).toEqual([]);
  });
});

describe('pendingTurnEffect / beginTurn (2.1)', () => {
  // memory-duel: "Blind Spot shortens the reveal on the affected turn"
  it('a queued reveal effect sets the next turn revealMs and is then cleared', () => {
    // player misses -> opponent turn begins; queue a 300ms reveal for that turn
    const grid = [pos(0, 'pikachu'), pos(1, 'eevee'), pos(2, 'pikachu'), pos(3, 'eevee')];
    let s = stateFromGrid(grid);
    s = queueTurnEffect(s, { revealMs: 300 });
    expect(s.pendingTurnEffect).toEqual({ revealMs: 300 });

    s = flip(s, 0);
    s = flip(s, 1);
    s = resolve(s); // miss -> begins opponent turn, consuming the pending effect
    expect(s.activePlayer).toBe('opponent');
    expect(s.revealMs).toBe(300);
    expect(s.pendingTurnEffect).toBeNull();
  });

  it('without a pending effect a new turn uses the default reveal', () => {
    const grid = [pos(0, 'pikachu'), pos(1, 'eevee'), pos(2, 'pikachu'), pos(3, 'eevee')];
    let s = stateFromGrid(grid);
    s = flip(s, 0);
    s = flip(s, 1);
    s = resolve(s); // miss
    expect(s.revealMs).toBe(DEFAULT_REVEAL_MS);
  });
});

describe('expireTurn (2.3, Speed Round)', () => {
  // memory-duel: "Turn ends early under Speed Round"
  it('expiry after zero flips passes the turn and claims nothing', () => {
    const grid = [pos(0, 'pikachu'), pos(1, 'pikachu')];
    let s = stateFromGrid(grid);
    s = expireTurn(s);
    expect(s.lastOutcome).toBe('expired');
    expect(s.activePlayer).toBe('opponent');
    expect(s.claimedPairs).toEqual({ player: 0, opponent: 0 });
    expect(s.phase).toBe('awaitingFirst');
  });

  // match-modifiers: "Opponent turn expires under Speed Round"
  it('expiry after one flip leaves that card revealed and claims nothing', () => {
    const grid = [pos(0, 'pikachu'), pos(1, 'eevee'), pos(2, 'pikachu')];
    let s = stateFromGrid(grid, { activePlayer: 'opponent' });
    s = flip(s, 0);
    expect(s.grid.find((p) => p.cardId === 0).faceUp).toBe(true);
    s = expireTurn(s);
    // the flipped card remains revealed
    expect(s.grid.find((p) => p.cardId === 0).faceUp).toBe(true);
    expect(s.activePlayer).toBe('player'); // passed
    expect(s.claimedPairs).toEqual({ player: 0, opponent: 0 });
  });
});

describe('reshuffle (2.2, Chaos)', () => {
  // memory-duel: "Mid-match reshuffle of unclaimed cards"
  it('keeps claimed pairs/counts and only rearranges unclaimed positions', () => {
    const grid = [
      pos(0, 'pikachu', { claimedBy: 'player' }),
      pos(1, 'pikachu', { claimedBy: 'player' }),
      pos(2, 'eevee'),
      pos(3, 'onix'),
      pos(4, 'eevee'),
      pos(5, 'onix'),
    ];
    let s = stateFromGrid(grid, { claimedPairs: { player: 1, opponent: 0 } });
    s = reshuffle(s);
    expect(s.claimedPairs).toEqual({ player: 1, opponent: 0 });
    // claimed positions unchanged
    expect(s.grid[0].claimedBy).toBe('player');
    expect(s.grid[1].claimedBy).toBe('player');
    // unclaimed names preserved as a multiset
    const unclaimed = s.grid.filter((p) => p.claimedBy === null).map((p) => p.name).sort();
    expect(unclaimed).toEqual(['eevee', 'eevee', 'onix', 'onix']);
    expect(s.flippedThisTurn).toEqual([]);
  });

  it('is a no-op outside a turn boundary', () => {
    const grid = [pos(0, 'eevee'), pos(1, 'onix')];
    const s = stateFromGrid(grid, { phase: 'resolving' });
    expect(reshuffle(s)).toBe(s);
  });
});

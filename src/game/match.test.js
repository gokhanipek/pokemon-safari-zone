import {
  buildGrid,
  evaluateFlips,
  determineWinner,
  isGridCleared,
} from './match';

const playerDeck = { pokemon: ['pikachu', 'bulbasaur', 'charmander', 'squirtle', 'jigglypuff'] };
const opponentDeck = { pokemon: ['eevee', 'psyduck', 'snorlax', 'gyarados', 'onix'] };

describe('buildGrid', () => {
  // memory-duel: "Grid assembled from both decks", "Card faces hidden at start"
  it('two 10-card decks produce 20 face-down, unclaimed positions', () => {
    const grid = buildGrid(playerDeck, opponentDeck);
    expect(grid).toHaveLength(20);
    grid.forEach((pos) => {
      expect(pos.faceUp).toBe(false);
      expect(pos.claimedBy).toBeNull();
      expect(typeof pos.name).toBe('string');
    });
  });

  it('every name appears an even number of times (each card has a partner)', () => {
    const grid = buildGrid(playerDeck, opponentDeck);
    const counts = grid.reduce((acc, pos) => {
      acc[pos.name] = (acc[pos.name] || 0) + 1;
      return acc;
    }, {});
    Object.values(counts).forEach((count) => {
      expect(count % 2).toBe(0);
    });
  });

  it('assigns unique cardIds', () => {
    const grid = buildGrid(playerDeck, opponentDeck);
    const ids = new Set(grid.map((p) => p.cardId));
    expect(ids.size).toBe(20);
  });
});

describe('evaluateFlips', () => {
  // memory-duel: matching, miss
  it('same name at different positions is a match', () => {
    expect(
      evaluateFlips({ cardId: 0, name: 'pikachu' }, { cardId: 5, name: 'pikachu' })
    ).toBe('match');
  });

  it('different names is a miss', () => {
    expect(
      evaluateFlips({ cardId: 0, name: 'pikachu' }, { cardId: 5, name: 'eevee' })
    ).toBe('miss');
  });

  it('same position (same cardId) is not a match', () => {
    expect(
      evaluateFlips({ cardId: 3, name: 'pikachu' }, { cardId: 3, name: 'pikachu' })
    ).toBe('miss');
  });
});

describe('determineWinner', () => {
  // memory-duel: "Player wins on pairs", "Opponent wins on pairs", "Draw on equal pairs"
  it('player wins with more pairs', () => {
    expect(determineWinner({ player: 6, opponent: 4 })).toBe('player');
  });

  it('opponent wins with more pairs', () => {
    expect(determineWinner({ player: 3, opponent: 7 })).toBe('opponent');
  });

  it('equal pairs is a draw', () => {
    expect(determineWinner({ player: 5, opponent: 5 })).toBe('draw');
  });
});

describe('isGridCleared', () => {
  it('true only when every position is claimed', () => {
    expect(
      isGridCleared([
        { claimedBy: 'player' },
        { claimedBy: 'opponent' },
      ])
    ).toBe(true);
    expect(
      isGridCleared([
        { claimedBy: 'player' },
        { claimedBy: null },
      ])
    ).toBe(false);
  });
});

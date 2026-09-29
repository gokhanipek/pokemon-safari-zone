// Pure turn state machine for the memory duel.
// All functions return a NEW state; none mutate their input.
//
// State shape:
// {
//   grid: Array<{cardId, name, faceUp, claimedBy}>,
//   activePlayer: 'player' | 'opponent',
//   phase: 'awaitingFirst' | 'awaitingSecond' | 'resolving' | 'ended',
//   flippedThisTurn: number[],            // cardIds flipped this turn (0-2)
//   claimedPairs: { player: number, opponent: number },
//   lastOutcome: 'match' | 'miss' | null, // result of the most recent resolve
// }

import { buildGrid, evaluateFlips, determineWinner, isGridCleared } from './match';

export const OTHER = { player: 'opponent', opponent: 'player' };

/**
 * Create the initial match state for two decks.
 * @param {{pokemon:string[]}} playerDeck
 * @param {{pokemon:string[]}} opponentDeck
 * @param {'player'|'opponent'} [startingPlayer='player']
 */
export function createMatch(playerDeck, opponentDeck, startingPlayer = 'player') {
  return {
    grid: buildGrid(playerDeck, opponentDeck),
    activePlayer: startingPlayer,
    phase: 'awaitingFirst',
    flippedThisTurn: [],
    claimedPairs: { player: 0, opponent: 0 },
    lastOutcome: null,
  };
}

function positionById(grid, cardId) {
  return grid.find((p) => p.cardId === cardId);
}

/**
 * Whether a card at cardId can be flipped by the active player right now.
 */
export function canFlip(state, cardId) {
  if (state.phase !== 'awaitingFirst' && state.phase !== 'awaitingSecond') {
    return false;
  }
  const pos = positionById(state.grid, cardId);
  if (!pos) return false;
  if (pos.claimedBy !== null) return false; // already claimed
  if (pos.faceUp) return false; // already face-up
  if (state.flippedThisTurn.includes(cardId)) return false;
  return true;
}

/**
 * Flip one card face-up for the active player.
 * After the second flip, phase becomes 'resolving' (call resolve() next).
 * Ignored (returns unchanged state) if the flip is not allowed.
 */
export function flip(state, cardId) {
  if (!canFlip(state, cardId)) {
    return state;
  }
  const grid = state.grid.map((p) =>
    p.cardId === cardId ? { ...p, faceUp: true } : p
  );
  const flippedThisTurn = [...state.flippedThisTurn, cardId];
  const phase = flippedThisTurn.length === 2 ? 'resolving' : 'awaitingSecond';
  return { ...state, grid, flippedThisTurn, phase };
}

/**
 * Resolve the two flipped cards.
 * - Match: both positions claimed by the active player, turn kept, ready for next flip.
 * - Miss: both cards flipped back down, turn passes to the other player.
 * When the grid is cleared after a resolve, phase becomes 'ended'.
 * Only valid when phase === 'resolving'.
 */
export function resolve(state) {
  if (state.phase !== 'resolving') {
    return state;
  }
  const [firstId, secondId] = state.flippedThisTurn;
  const a = positionById(state.grid, firstId);
  const b = positionById(state.grid, secondId);
  const outcome = evaluateFlips(a, b);

  if (outcome === 'match') {
    const grid = state.grid.map((p) =>
      p.cardId === firstId || p.cardId === secondId
        ? { ...p, faceUp: false, claimedBy: state.activePlayer }
        : p
    );
    const claimedPairs = {
      ...state.claimedPairs,
      [state.activePlayer]: state.claimedPairs[state.activePlayer] + 1,
    };
    const cleared = isGridCleared(grid);
    return {
      ...state,
      grid,
      claimedPairs,
      flippedThisTurn: [],
      phase: cleared ? 'ended' : 'awaitingFirst',
      lastOutcome: 'match',
      // active player keeps the turn on a match
    };
  }

  // miss: flip both back down, pass turn
  const grid = state.grid.map((p) =>
    p.cardId === firstId || p.cardId === secondId
      ? { ...p, faceUp: false }
      : p
  );
  return {
    ...state,
    grid,
    flippedThisTurn: [],
    activePlayer: OTHER[state.activePlayer],
    phase: 'awaitingFirst',
    lastOutcome: 'miss',
  };
}

/**
 * The final outcome once the match has ended, or null if still in progress.
 * @returns {'player'|'opponent'|'draw'|null}
 */
export function matchOutcome(state) {
  if (state.phase !== 'ended') {
    return null;
  }
  return determineWinner(state.claimedPairs);
}

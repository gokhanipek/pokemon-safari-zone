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
//   claimedNames: { player: string[], opponent: string[] }, // names claimed per side
//   lastOutcome: 'match' | 'miss' | 'expired' | null,
//   defaultRevealMs: number,              // baseline reveal duration
//   revealMs: number,                     // reveal for the CURRENT turn
//   turnLimitMs: number | null,           // Speed Round clock for the CURRENT turn
//   pendingTurnEffect: null | {           // applies to the next turn that begins
//     revealMs?: number,
//     turnLimitMs?: number,
//   },
// }

import { buildGrid, evaluateFlips, determineWinner, isGridCleared } from './match';
import { reshuffleUnclaimed } from './modifiers';

export const OTHER = { player: 'opponent', opponent: 'player' };

export const DEFAULT_REVEAL_MS = 800;

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
    claimedNames: { player: [], opponent: [] },
    lastOutcome: null,
    defaultRevealMs: DEFAULT_REVEAL_MS,
    revealMs: DEFAULT_REVEAL_MS,
    turnLimitMs: null,
    pendingTurnEffect: null,
  };
}

function positionById(grid, cardId) {
  return grid.find((p) => p.cardId === cardId);
}

/**
 * Begin a new turn for `activePlayer`: consume any pendingTurnEffect into this
 * turn's revealMs / turnLimitMs, otherwise fall back to defaults.
 * Pure; returns new state with phase 'awaitingFirst' and an empty flip list.
 */
function beginTurn(state, activePlayer) {
  const pending = state.pendingTurnEffect;
  return {
    ...state,
    activePlayer,
    phase: 'awaitingFirst',
    flippedThisTurn: [],
    revealMs:
      pending && typeof pending.revealMs === 'number'
        ? pending.revealMs
        : state.defaultRevealMs,
    turnLimitMs:
      pending && typeof pending.turnLimitMs === 'number'
        ? pending.turnLimitMs
        : null,
    pendingTurnEffect: null,
  };
}

/**
 * Queue an effect to apply to the opponent's next turn (Blind Spot / Speed Round).
 * `effect` is { revealMs?, turnLimitMs? }. Applied when that turn begins.
 */
export function queueTurnEffect(state, effect) {
  return { ...state, pendingTurnEffect: { ...effect } };
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
    const claimedNames = {
      ...state.claimedNames,
      [state.activePlayer]: [...state.claimedNames[state.activePlayer], a.name],
    };
    const cleared = isGridCleared(grid);
    return {
      ...state,
      grid,
      claimedPairs,
      claimedNames,
      flippedThisTurn: [],
      phase: cleared ? 'ended' : 'awaitingFirst',
      lastOutcome: 'match',
      // active player keeps the turn on a match; reveal/limit unchanged this turn
    };
  }

  // miss: flip both back down, pass turn (begin the other player's turn)
  const grid = state.grid.map((p) =>
    p.cardId === firstId || p.cardId === secondId
      ? { ...p, faceUp: false }
      : p
  );
  return beginTurn(
    { ...state, grid, lastOutcome: 'miss' },
    OTHER[state.activePlayer]
  );
}

/**
 * Speed Round timeout: end the current turn after 0 or 1 flips.
 * Any card already flipped this turn REMAINS revealed (no flip-back), no pair
 * is claimed, and the turn passes to the other player.
 * Valid while awaiting flips (awaitingFirst / awaitingSecond).
 */
export function expireTurn(state) {
  if (state.phase !== 'awaitingFirst' && state.phase !== 'awaitingSecond') {
    return state;
  }
  // Cards flipped this turn stay face-up (grid already reflects that).
  return beginTurn(
    { ...state, lastOutcome: 'expired' },
    OTHER[state.activePlayer]
  );
}

/**
 * Chaos: reshuffle unclaimed positions immediately. Claimed cards stay put.
 * The current turn's flip progress is reset (any this-turn flips are cleared,
 * since reshuffleUnclaimed sets unclaimed cards face-down), keeping the active
 * player but restarting their flip count. Only valid at a turn boundary
 * (awaitingFirst) so it never strands a mid-resolve pair.
 */
export function reshuffle(state) {
  if (state.phase !== 'awaitingFirst') {
    return state;
  }
  return {
    ...state,
    grid: reshuffleUnclaimed(state.grid),
    flippedThisTurn: [],
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

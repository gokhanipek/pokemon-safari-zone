// Opponent AI selection (Phase 1: basic) + modifier trigger policy (Phase 2).
// Pure selection helper - the component schedules these picks on timers.

import { CHAOS } from './modifiers';

/**
 * Positions the opponent may still flip: face-down, unclaimed, and not
 * already flipped this turn.
 * @param {{grid:Array, flippedThisTurn:number[]}} state
 */
export function flippablePositions(state) {
  return state.grid.filter(
    (p) =>
      p.claimedBy === null &&
      !p.faceUp &&
      !state.flippedThisTurn.includes(p.cardId)
  );
}

/**
 * Choose the next cardId for the opponent to flip.
 *
 * Basic strategy sufficient for Phase 1:
 * - If exactly one card is already flipped this turn and the opponent has
 *   previously "seen" a matching card that is still available, flip it.
 * - Otherwise pick a random available card.
 *
 * `seen` is an optional map of cardId -> name the opponent remembers.
 * @param {{grid:Array, flippedThisTurn:number[]}} state
 * @param {Object<number,string>} [seen={}]
 * @returns {number|null} cardId to flip, or null if none available
 */
export function chooseOpponentFlip(state, seen = {}) {
  const available = flippablePositions(state);
  if (available.length === 0) {
    return null;
  }

  // Second pick: try to complete a known pair.
  if (state.flippedThisTurn.length === 1) {
    const firstId = state.flippedThisTurn[0];
    const first = state.grid.find((p) => p.cardId === firstId);
    if (first) {
      const knownMatch = available.find(
        (p) => seen[p.cardId] === first.name && p.cardId !== firstId
      );
      if (knownMatch) {
        return knownMatch.cardId;
      }
    }
  }

  // First pick: if two same-named cards are both known, open one of them.
  if (state.flippedThisTurn.length === 0) {
    const byName = {};
    available.forEach((p) => {
      if (seen[p.cardId]) {
        byName[seen[p.cardId]] = byName[seen[p.cardId]] || [];
        byName[seen[p.cardId]].push(p.cardId);
      }
    });
    const knownPair = Object.values(byName).find((ids) => ids.length >= 2);
    if (knownPair) {
      return knownPair[0];
    }
  }

  // Fallback: random available card.
  const index = Math.floor(Math.random() * available.length);
  return available[index].cardId;
}

/**
 * How many cards the opponent may hold in memory at once.
 * capacity = difficulty level + modifier tier, where:
 * - level is the difficulty rank (0 easy, 1 normal, 2 hard)
 * - tier is the relevant modifier tier (the opponent's own modifier tier for
 *   the opponent's memory); a missing/null modifier contributes 0.
 * The result is never negative.
 * @param {number} level
 * @param {number} [tier]
 * @returns {number}
 */
export function memoryCapacity(level, tier) {
  const lvl = Number.isFinite(level) ? level : 0;
  const t = Number.isFinite(tier) ? tier : 0;
  const cap = lvl + t;
  return cap > 0 ? cap : 0;
}

/**
 * Update the opponent's memory of seen cards after a flip is revealed.
 *
 * When `capacity` is a number, the memory is bounded to that many cards: the
 * just-seen card is always kept, and if that pushes memory over capacity, other
 * remembered cards are forgotten (chosen at random) down to the limit. A
 * capacity of 0 means the opponent remembers nothing. Omitting `capacity`
 * leaves the memory unbounded (prior behavior).
 * @param {Object<number,string>} seen
 * @param {{cardId:number,name:string}} position
 * @param {number} [capacity]
 * @returns {Object<number,string>} new memory map
 */
export function rememberCard(seen, position, capacity) {
  const next = { ...seen, [position.cardId]: position.name };
  if (typeof capacity !== 'number') {
    return next;
  }
  if (capacity <= 0) {
    return {};
  }
  const keys = Object.keys(next);
  if (keys.length <= capacity) {
    return next;
  }
  // Over capacity: forget random cards, but never the one just seen.
  const justSeen = String(position.cardId);
  const removable = keys.filter((k) => k !== justSeen);
  let removeCount = keys.length - capacity;
  while (removeCount > 0 && removable.length > 0) {
    const idx = Math.floor(Math.random() * removable.length);
    const [key] = removable.splice(idx, 1);
    delete next[key];
    removeCount -= 1;
  }
  return next;
}

/**
 * Decide whether the opponent should trigger its held modifier this turn.
 *
 * Basic Phase 2 policy (once per match):
 * - Only when the opponent holds an untriggered modifier and it is the
 *   opponent's turn at a turn boundary (awaitingFirst, no flips yet).
 * - Chaos: fire when the opponent is trailing (the player has claimed more
 *   pairs), to disrupt the board.
 * - Blind Spot / Speed Round (opponent-next-turn effects): fire so they land
 *   on the player's upcoming turn.
 *
 * @param {object} state - match state ({activePlayer, phase, flippedThisTurn, claimedPairs})
 * @param {{id:string,tier:number}|null} modifier - the opponent's held modifier
 * @param {boolean} alreadyTriggered - whether the opponent already used it this match
 * @returns {boolean} true if the opponent should trigger now
 */
export function chooseOpponentModifierTrigger(state, modifier, alreadyTriggered) {
  if (!modifier || alreadyTriggered) return false;
  if (state.activePlayer !== 'opponent') return false;
  if (state.phase !== 'awaitingFirst') return false;
  if (state.flippedThisTurn.length !== 0) return false;

  if (modifier.id === CHAOS) {
    // Disrupt when trailing.
    return state.claimedPairs.player > state.claimedPairs.opponent;
  }
  // opponentNextTurn effects (Blind Spot / Speed Round): always worth firing
  // to hamper the player's next turn.
  return true;
}

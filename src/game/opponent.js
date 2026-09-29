// Opponent AI selection (Phase 1: basic).
// Pure selection helper - the component schedules these picks on timers.

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
 * Update the opponent's memory of seen cards after a flip is revealed.
 * @param {Object<number,string>} seen
 * @param {{cardId:number,name:string}} position
 * @returns {Object<number,string>} new memory map
 */
export function rememberCard(seen, position) {
  return { ...seen, [position.cardId]: position.name };
}

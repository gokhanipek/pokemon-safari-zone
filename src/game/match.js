// Pure match logic: grid construction, flip evaluation, winner determination.
import { deckToCards } from './deck';

/**
 * Fisher-Yates shuffle. Returns a new shuffled array; does not mutate input.
 * @param {Array} array
 * @returns {Array}
 */
export function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Build the match grid from both decks combined, shuffled into face-down positions.
 * Each position: { cardId, name, faceUp:false, claimedBy:null }.
 * @param {{pokemon: string[]}} playerDeck
 * @param {{pokemon: string[]}} opponentDeck
 * @returns {Array<{cardId:number,name:string,faceUp:boolean,claimedBy:(string|null)}>}
 */
export function buildGrid(playerDeck, opponentDeck) {
  const names = [...deckToCards(playerDeck), ...deckToCards(opponentDeck)];
  const shuffled = shuffle(names);
  return shuffled.map((name, index) => ({
    cardId: index,
    name,
    faceUp: false,
    claimedBy: null,
  }));
}

/**
 * Evaluate two flipped positions.
 * A match requires the same name at two DIFFERENT positions.
 * @param {{cardId:number,name:string}} a
 * @param {{cardId:number,name:string}} b
 * @returns {'match'|'miss'}
 */
export function evaluateFlips(a, b) {
  if (a.name === b.name && a.cardId !== b.cardId) {
    return 'match';
  }
  return 'miss';
}

/**
 * Determine the winner from claimed-pair counts.
 * @param {{player:number, opponent:number}} claimedPairs
 * @returns {'player'|'opponent'|'draw'}
 */
export function determineWinner(claimedPairs) {
  if (claimedPairs.player > claimedPairs.opponent) {
    return 'player';
  }
  if (claimedPairs.opponent > claimedPairs.player) {
    return 'opponent';
  }
  return 'draw';
}

/**
 * Whether all positions on the grid are claimed.
 * @param {Array<{claimedBy:(string|null)}>} grid
 * @returns {boolean}
 */
export function isGridCleared(grid) {
  return grid.every((pos) => pos.claimedBy !== null);
}

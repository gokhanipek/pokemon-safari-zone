// Static roster of selectable opponents.
// Each opponent: { id, name, deck: {pokemon:[...]}, modifier: {id,tier}|null }.
// Decks reference existing image names under public/img/<name>.png and satisfy
// the 5-distinct / 10-card deck constraints.

import { BLIND_SPOT, CHAOS, SPEED_ROUND } from './modifiers';

export const OPPONENTS = [
  {
    id: 'rookie',
    name: 'Rookie Ranger',
    deck: { pokemon: ['eevee', 'psyduck', 'snorlax', 'charmander', 'squirtle'] },
    modifier: null,
  },
  {
    id: 'veteran',
    name: 'Veteran Trainer',
    deck: { pokemon: ['pikachu', 'eevee', 'psyduck', 'snorlax', 'jigglypuff'] },
    modifier: { id: BLIND_SPOT, tier: 1 },
  },
  {
    id: 'warden',
    name: 'The Warden',
    deck: { pokemon: ['snorlax', 'charmander', 'squirtle', 'bulbasaur', 'eevee'] },
    modifier: { id: SPEED_ROUND, tier: 1 },
  },
  {
    id: 'champion',
    name: 'Zone Champion',
    deck: { pokemon: ['pikachu', 'snorlax', 'eevee', 'psyduck', 'bulbasaur'] },
    modifier: { id: CHAOS, tier: 2 },
  },
];

/**
 * The selectable opponent roster.
 * @returns {Array<{id:string,name:string,deck:{pokemon:string[]},modifier:(object|null)}>}
 */
export function getOpponents() {
  return OPPONENTS;
}

/**
 * Look up an opponent by id.
 * @param {string} id
 */
export function getOpponentById(id) {
  return OPPONENTS.find((o) => o.id === id) || null;
}

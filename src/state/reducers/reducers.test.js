import reducer from './reducers';
import {
  startMatchAction,
  recordResultAction,
  stealCardAction,
} from './../actions/actions';
import { createStarterDeck, createOpponentDeck } from './../../game/deck';

function initial() {
  return reducer(undefined, { type: '@@INIT' });
}

describe('safariZoneReducer', () => {
  it('initializes with the starter deck and no result', () => {
    const state = initial();
    expect(state.playerDeck).toEqual(createStarterDeck());
    expect(state.opponentDeck).toBeNull();
    expect(state.result).toBeNull();
  });

  // 3.1: start match seeds opponent deck; record result stores outcome + counts
  it('START_MATCH seeds the opponent deck and clears prior result', () => {
    let state = initial();
    const opp = createOpponentDeck();
    state = reducer(state, startMatchAction(opp));
    expect(state.opponentDeck).toEqual(opp);
    expect(state.result).toBeNull();
    // player deck is untouched by starting a match
    expect(state.playerDeck).toEqual(createStarterDeck());
  });

  it('RECORD_RESULT stores outcome and claimed-pair counts', () => {
    let state = initial();
    state = reducer(state, recordResultAction('player', { player: 6, opponent: 4 }));
    expect(state.result).toEqual({
      outcome: 'player',
      claimedPairs: { player: 6, opponent: 4 },
    });
  });

  // 3.2: steal grows/swaps deck within constraints; loss/draw perform no steal
  it('STEAL_CARD adds a card after a win when there is room', () => {
    let state = reducer(undefined, { type: '@@INIT' });
    // shrink the player deck to make room
    state = { ...state, playerDeck: { pokemon: ['pikachu', 'bulbasaur'] } };
    state = reducer(state, recordResultAction('player', { player: 6, opponent: 4 }));
    state = reducer(state, stealCardAction('eevee'));
    expect(state.playerDeck.pokemon).toContain('eevee');
    expect(state.playerDeck.pokemon).toHaveLength(3);
  });

  it('STEAL_CARD with a full deck requires a swap and stays at 5 distinct', () => {
    let state = reducer(undefined, { type: '@@INIT' }); // 5 distinct starter
    const toRemove = state.playerDeck.pokemon[0];
    state = reducer(state, recordResultAction('player', { player: 6, opponent: 4 }));
    state = reducer(state, stealCardAction('eevee', toRemove));
    expect(state.playerDeck.pokemon).toHaveLength(5);
    expect(state.playerDeck.pokemon).toContain('eevee');
    expect(state.playerDeck.pokemon).not.toContain(toRemove);
  });

  it('STEAL_CARD does nothing on a loss', () => {
    let state = reducer(undefined, { type: '@@INIT' });
    state = { ...state, playerDeck: { pokemon: ['pikachu', 'bulbasaur'] } };
    state = reducer(state, recordResultAction('opponent', { player: 4, opponent: 6 }));
    const before = state.playerDeck;
    state = reducer(state, stealCardAction('eevee'));
    expect(state.playerDeck).toEqual(before);
  });

  it('STEAL_CARD does nothing on a draw', () => {
    let state = reducer(undefined, { type: '@@INIT' });
    state = { ...state, playerDeck: { pokemon: ['pikachu', 'bulbasaur'] } };
    state = reducer(state, recordResultAction('draw', { player: 5, opponent: 5 }));
    const before = state.playerDeck;
    state = reducer(state, stealCardAction('eevee'));
    expect(state.playerDeck).toEqual(before);
  });
});

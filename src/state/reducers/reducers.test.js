import reducer from './reducers';
import {
  startMatchAction,
  recordResultAction,
  stealCardAction,
  takeModifierAction,
  buyModifierAction,
  buyCardAction,
  setDifficultyAction,
} from './../actions/actions';
import { createStarterDeck, createOpponentDeck } from './../../game/deck';
import { MODIFIER_PRICE, modifierPrice, cardPrice } from './../../game/economy';
import { FIRST_DAY, CAMPAIGN_LENGTH_DAYS } from './../../game/campaign';
import { DEFAULT_DIFFICULTY, EASY, HARD } from './../../game/difficulty';

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
    expect(state.result.outcome).toBe('player');
    expect(state.result.claimedPairs).toEqual({ player: 6, opponent: 4 });
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

describe('safariZoneReducer - modifiers & economy', () => {
  // 3.1
  it('initializes with 0 points, empty modifier slot, null opponent modifier', () => {
    const s = initial();
    expect(s.points).toBe(0);
    expect(s.playerModifier).toBeNull();
    expect(s.opponentModifier).toBeNull();
  });

  it('START_MATCH seeds the opponent modifier', () => {
    let s = initial();
    s = reducer(s, startMatchAction(createOpponentDeck(), { id: 'chaos', tier: 2 }));
    expect(s.opponentModifier).toEqual({ id: 'chaos', tier: 2 });
  });

  // 3.2: points awarded on win and loss; opponent pairs never count; accumulation
  it('awards points from player claimed names on a win', () => {
    let s = initial();
    // pikachu(5) + snorlax(6) = 11
    s = reducer(s, recordResultAction('player', { player: 2, opponent: 1 }, ['pikachu', 'snorlax']));
    expect(s.points).toBe(11);
    expect(s.result.pointsEarned).toBe(11);
  });

  it('awards points on a loss too', () => {
    let s = initial();
    // jigglypuff(2) claimed by player even though they lost
    s = reducer(s, recordResultAction('opponent', { player: 1, opponent: 5 }, ['jigglypuff']));
    expect(s.points).toBe(2);
  });

  it('accumulates points across two matches', () => {
    let s = initial();
    s = reducer(s, recordResultAction('player', { player: 1, opponent: 0 }, ['eevee'])); // 4
    s = reducer(s, startMatchAction(createOpponentDeck()));
    s = reducer(s, recordResultAction('opponent', { player: 1, opponent: 2 }, ['psyduck'])); // 2
    expect(s.points).toBe(6);
  });

  // 3.3: modifier keep-or-swap
  it('TAKE_MODIFIER fills an empty slot after a win', () => {
    let s = initial();
    s = reducer(s, recordResultAction('player', { player: 3, opponent: 1 }, []));
    s = reducer(s, takeModifierAction({ id: 'blindSpot', tier: 1 }));
    expect(s.playerModifier).toEqual({ id: 'blindSpot', tier: 1 });
  });

  it('TAKE_MODIFIER on a full slot keeps current unless removeCurrent', () => {
    let s = initial();
    s = { ...s, playerModifier: { id: 'chaos', tier: 1 } };
    s = reducer(s, recordResultAction('player', { player: 3, opponent: 1 }, []));
    // without removeCurrent: no change
    let kept = reducer(s, takeModifierAction({ id: 'blindSpot', tier: 2 }));
    expect(kept.playerModifier).toEqual({ id: 'chaos', tier: 1 });
    // with removeCurrent: swap
    let swapped = reducer(s, takeModifierAction({ id: 'blindSpot', tier: 2 }, true));
    expect(swapped.playerModifier).toEqual({ id: 'blindSpot', tier: 2 });
  });

  it('TAKE_MODIFIER does nothing on a loss', () => {
    let s = initial();
    s = reducer(s, recordResultAction('opponent', { player: 1, opponent: 3 }, []));
    s = reducer(s, takeModifierAction({ id: 'chaos', tier: 1 }));
    expect(s.playerModifier).toBeNull();
  });

  // 3.4: fixed-price purchase
  it('BUY_MODIFIER succeeds when affordable and slot empty', () => {
    let s = initial();
    s = { ...s, points: MODIFIER_PRICE + 3 };
    s = reducer(s, buyModifierAction({ id: 'speedRound', tier: 1 }));
    expect(s.playerModifier).toEqual({ id: 'speedRound', tier: 1 });
    expect(s.points).toBe(3);
  });

  it('BUY_MODIFIER rejected when unaffordable', () => {
    let s = initial();
    s = { ...s, points: MODIFIER_PRICE - 1 };
    const before = s.points;
    s = reducer(s, buyModifierAction({ id: 'speedRound', tier: 1 }));
    expect(s.playerModifier).toBeNull();
    expect(s.points).toBe(before);
  });

  it('BUY_MODIFIER on a full slot requires removeCurrent', () => {
    let s = initial();
    s = { ...s, points: MODIFIER_PRICE, playerModifier: { id: 'chaos', tier: 1 } };
    // without removeCurrent: no change, no deduction
    let blocked = reducer(s, buyModifierAction({ id: 'blindSpot', tier: 1 }));
    expect(blocked.playerModifier).toEqual({ id: 'chaos', tier: 1 });
    expect(blocked.points).toBe(MODIFIER_PRICE);
    // with removeCurrent: swap and deduct (tier 1 price)
    let ok = reducer(s, buyModifierAction({ id: 'blindSpot', tier: 1 }, true));
    expect(ok.playerModifier).toEqual({ id: 'blindSpot', tier: 1 });
    expect(ok.points).toBe(0);
  });

  it('BUY_MODIFIER deducts the tier-3 price for a tier-3 purchase', () => {
    let s = initial();
    s = { ...s, points: modifierPrice(3) + 5 };
    s = reducer(s, buyModifierAction({ id: 'speedRound', tier: 3 }));
    expect(s.playerModifier).toEqual({ id: 'speedRound', tier: 3 });
    expect(s.points).toBe(5);
  });

  it('BUY_MODIFIER at tier 3 is rejected when only tier-1 credits are held', () => {
    let s = initial();
    s = { ...s, points: modifierPrice(1) };
    const before = s.points;
    s = reducer(s, buyModifierAction({ id: 'speedRound', tier: 3 }));
    expect(s.playerModifier).toBeNull();
    expect(s.points).toBe(before);
  });

  // 3.5: persistence across matches
  it('modifier and points persist across a new match', () => {
    let s = initial();
    s = { ...s, points: 20, playerModifier: { id: 'chaos', tier: 2 } };
    s = reducer(s, startMatchAction(createOpponentDeck(), { id: 'blindSpot', tier: 1 }));
    expect(s.points).toBe(20);
    expect(s.playerModifier).toEqual({ id: 'chaos', tier: 2 });
  });
});

describe('safariZoneReducer - BUY_CARD', () => {
  // A card not in the starter deck, priced from its value.
  const NEW_CARD = 'snorlax';

  it('adds a bought card when there is room and deducts its price', () => {
    let s = initial();
    // make room: shrink to 2 distinct, fund the purchase
    s = { ...s, playerDeck: { pokemon: ['pikachu', 'bulbasaur'] }, points: cardPrice(NEW_CARD) + 4 };
    s = reducer(s, buyCardAction(NEW_CARD));
    expect(s.playerDeck.pokemon).toContain(NEW_CARD);
    expect(s.playerDeck.pokemon).toHaveLength(3);
    expect(s.points).toBe(4);
  });

  it('requires a removeName swap when the deck is full and stays at 5 distinct', () => {
    let s = initial(); // 5 distinct starter
    const toRemove = s.playerDeck.pokemon[0];
    s = { ...s, points: cardPrice(NEW_CARD) };
    s = reducer(s, buyCardAction(NEW_CARD, toRemove));
    expect(s.playerDeck.pokemon).toHaveLength(5);
    expect(s.playerDeck.pokemon).toContain(NEW_CARD);
    expect(s.playerDeck.pokemon).not.toContain(toRemove);
    expect(s.points).toBe(0);
  });

  it('rejects a full-deck purchase with no removeName and leaves state unchanged', () => {
    let s = initial(); // 5 distinct starter
    s = { ...s, points: cardPrice(NEW_CARD) };
    const beforeDeck = s.playerDeck;
    const beforePoints = s.points;
    s = reducer(s, buyCardAction(NEW_CARD));
    expect(s.playerDeck).toEqual(beforeDeck);
    expect(s.points).toBe(beforePoints);
  });

  it('rejects an unaffordable purchase and leaves state unchanged', () => {
    let s = initial();
    s = { ...s, playerDeck: { pokemon: ['pikachu', 'bulbasaur'] }, points: cardPrice(NEW_CARD) - 1 };
    const beforeDeck = s.playerDeck;
    const beforePoints = s.points;
    s = reducer(s, buyCardAction(NEW_CARD));
    expect(s.playerDeck).toEqual(beforeDeck);
    expect(s.points).toBe(beforePoints);
  });

  it('rejects buying a card already owned and leaves state unchanged', () => {
    let s = initial();
    const owned = s.playerDeck.pokemon[0];
    s = { ...s, points: cardPrice(owned) + 10 };
    const beforeDeck = s.playerDeck;
    const beforePoints = s.points;
    s = reducer(s, buyCardAction(owned));
    expect(s.playerDeck).toEqual(beforeDeck);
    expect(s.points).toBe(beforePoints);
  });
});

describe('safariZoneReducer - campaign days', () => {
  it('starts on the first day, not released', () => {
    const s = initial();
    expect(s.day).toBe(FIRST_DAY);
    expect(s.released).toBe(false);
  });

  it('advances the day when a match completes', () => {
    let s = initial();
    s = reducer(s, recordResultAction('player', { player: 2, opponent: 1 }, ['pikachu']));
    expect(s.day).toBe(FIRST_DAY + 1);
    expect(s.released).toBe(false);
  });

  it('advances the day on a loss without penalty', () => {
    let s = initial();
    s = { ...s, points: 10, playerModifier: { id: 'chaos', tier: 1 } };
    const deckBefore = s.playerDeck;
    s = reducer(s, recordResultAction('opponent', { player: 1, opponent: 3 }, ['jigglypuff'])); // +2
    expect(s.day).toBe(FIRST_DAY + 1);
    // no penalty: modifier and deck untouched, points only grew from claimed pairs
    expect(s.playerModifier).toEqual({ id: 'chaos', tier: 1 });
    expect(s.playerDeck).toEqual(deckBefore);
    expect(s.points).toBe(12);
  });

  it('releases the player after the final day and latches the day', () => {
    let s = initial();
    s = { ...s, day: CAMPAIGN_LENGTH_DAYS }; // on the final day
    s = reducer(s, recordResultAction('player', { player: 2, opponent: 1 }, []));
    expect(s.day).toBe(CAMPAIGN_LENGTH_DAYS + 1);
    expect(s.released).toBe(true);
    // a further match does not advance the day once released
    s = reducer(s, recordResultAction('player', { player: 2, opponent: 1 }, []));
    expect(s.day).toBe(CAMPAIGN_LENGTH_DAYS + 1);
    expect(s.released).toBe(true);
  });

  it('keeps day and released stable across starting a new match', () => {
    let s = initial();
    s = reducer(s, recordResultAction('player', { player: 1, opponent: 0 }, ['eevee']));
    const dayAfterMatch = s.day;
    s = reducer(s, startMatchAction(createOpponentDeck()));
    expect(s.day).toBe(dayAfterMatch);
    expect(s.released).toBe(false);
  });
});

describe('safariZoneReducer - difficulty', () => {
  it('defaults to the normal difficulty', () => {
    expect(initial().difficulty).toBe(DEFAULT_DIFFICULTY);
  });

  it('SET_DIFFICULTY sets the selected level', () => {
    let s = initial();
    s = reducer(s, setDifficultyAction(EASY));
    expect(s.difficulty).toBe(EASY);
    s = reducer(s, setDifficultyAction(HARD));
    expect(s.difficulty).toBe(HARD);
  });

  it('SET_DIFFICULTY clamps out-of-range values', () => {
    let s = initial();
    s = reducer(s, setDifficultyAction(99));
    expect(s.difficulty).toBe(HARD);
    s = reducer(s, setDifficultyAction(-4));
    expect(s.difficulty).toBe(EASY);
  });
});

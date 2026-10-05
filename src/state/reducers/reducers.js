import { combineReducers } from 'redux'
import * as Actions from './../actions/actions'
import { createStarterDeck, addPokemon, swapPokemon, isDeckFull, canAddPokemon } from './../../game/deck'
import { scoreClaimedNames, modifierPrice, cardPrice } from './../../game/economy'
import { FIRST_DAY, advanceDay, isReleased } from './../../game/campaign'
import { DEFAULT_DIFFICULTY, clampDifficulty } from './../../game/difficulty'
import vatReducer from './vatReducer'

const initialState = {
    userName: '',
    difficulty: DEFAULT_DIFFICULTY,    // player-selected global difficulty (0 easy, 1 normal, 2 hard)
    playerDeck: createStarterDeck(),   // { pokemon: string[] } - persists across matches
    playerModifier: null,              // { id, tier } | null - persists across matches
    points: 0,                         // running points balance - persists
    day: FIRST_DAY,                    // current campaign day - persists across matches
    released: false,                   // true once the campaign span is played through (win)
    opponentDeck: null,                // deck for the current match
    opponentModifier: null,            // opponent's modifier for the current match
    result: null                       // { outcome, claimedPairs, pointsEarned } after a match
  };

export default function safariZoneReducer( state = initialState, action ){
    switch(action.type){ 
        case Actions.REGISTER:
            return {
                ...state, 
                userName: action.userName
            }
        case Actions.SET_DIFFICULTY:
            return {
                ...state,
                difficulty: clampDifficulty(action.level)
            }
        case Actions.START_MATCH:
            // Seed the current match's opponent; preserve persistent player state
            // (deck, modifier, points).
            return {
                ...state,
                opponentDeck: action.opponentDeck,
                opponentModifier: action.opponentModifier || null,
                result: null
            }
        case Actions.RECORD_RESULT: {
            // Award points from the player's claimed pairs on ANY outcome.
            const pointsEarned = scoreClaimedNames(action.playerClaimedNames)
            // A completed match advances the day regardless of outcome. Once
            // released, the day counter latches so post-release matches don't
            // run it up.
            const nextDay = state.released ? state.day : advanceDay(state.day)
            return {
                ...state,
                points: state.points + pointsEarned,
                day: nextDay,
                released: state.released || isReleased(nextDay),
                result: {
                    outcome: action.outcome,
                    claimedPairs: action.claimedPairs,
                    pointsEarned
                }
            }
        }
        case Actions.STEAL_CARD: {
            // Only allow a steal after a player win.
            if(!state.result || state.result.outcome !== 'player'){
                return state
            }
            const nextDeck = action.removeName
                ? swapPokemon(state.playerDeck, action.removeName, action.addName)
                : addPokemon(state.playerDeck, action.addName)
            return {
                ...state,
                playerDeck: nextDeck
            }
        }
        case Actions.TAKE_MODIFIER: {
            // Only after a player win, and only if there is a modifier to take.
            if(!state.result || state.result.outcome !== 'player' || !action.modifier){
                return state
            }
            // Single slot: fill if empty, or keep-or-swap if full.
            if(state.playerModifier && !action.removeCurrent){
                // player chose to keep the current modifier; no change
                return state
            }
            return {
                ...state,
                playerModifier: { ...action.modifier }
            }
        }
        case Actions.BUY_MODIFIER: {
            if(!action.modifier){
                return state
            }
            const price = modifierPrice(action.modifier.tier)
            // Reject if unaffordable.
            if(state.points < price){
                return state
            }
            // Full slot requires an explicit swap.
            if(state.playerModifier && !action.removeCurrent){
                return state
            }
            return {
                ...state,
                points: state.points - price,
                playerModifier: { ...action.modifier }
            }
        }
        case Actions.BUY_CARD: {
            if(!action.addName){
                return state
            }
            // Reject if the card is already owned.
            if(state.playerDeck.pokemon.includes(action.addName)){
                return state
            }
            const price = cardPrice(action.addName)
            // Reject if unaffordable.
            if(state.points < price){
                return state
            }
            if(isDeckFull(state.playerDeck)){
                // Full deck: require a valid swap target.
                if(!action.removeName){
                    return state
                }
                const swapped = swapPokemon(state.playerDeck, action.removeName, action.addName)
                if(swapped === state.playerDeck){
                    return state // swap was invalid; no change
                }
                return { ...state, points: state.points - price, playerDeck: swapped }
            }
            // Room in the deck.
            if(!canAddPokemon(state.playerDeck, action.addName)){
                return state
            }
            return {
                ...state,
                points: state.points - price,
                playerDeck: addPokemon(state.playerDeck, action.addName)
            }
        }
        case Actions.RESET_RESULT:
            return {
                ...state,
                result: null
            }
        default:
            return state
    }
}
export const allReducers = combineReducers({
    safariZoneReducer,
    vatReducer
})

import { combineReducers } from 'redux'
import * as Actions from './../actions/actions'
import { createStarterDeck, addPokemon, swapPokemon } from './../../game/deck'

const initialState = {
    userName: '',
    playerDeck: createStarterDeck(),   // { pokemon: string[] } - persists across matches
    opponentDeck: null,                // deck for the current match
    result: null                       // { outcome, claimedPairs } after a match ends
  };

export default function safariZoneReducer( state = initialState, action ){
    switch(action.type){ 
        case Actions.REGISTER:
            return {
                ...state, 
                userName: action.userName
            }
        case Actions.START_MATCH:
            return {
                ...state,
                opponentDeck: action.opponentDeck,
                result: null
            }
        case Actions.RECORD_RESULT:
            return {
                ...state,
                result: {
                    outcome: action.outcome,
                    claimedPairs: action.claimedPairs
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
    safariZoneReducer 
})

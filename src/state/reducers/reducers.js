import { combineReducers } from 'redux'
import * as Actions from './../actions/actions'

const initialState = {
    userName: ''
  };

export default function safariZoneReducer( state = initialState, action ){
    switch(action.type){ 
        case Actions.REGISTER:
            return {
                ...initialState, 
                userName: action.userName
            }
        default:
            return state
    }
}
export const allReducers = combineReducers({
    safariZoneReducer 
})
export const REGISTER = 'REGISTER'
export const START_MATCH = 'START_MATCH'
export const RECORD_RESULT = 'RECORD_RESULT'
export const STEAL_CARD = 'STEAL_CARD'
export const RESET_RESULT = 'RESET_RESULT'

export function registerUserAction(newUser){
  return {
    type: REGISTER,
    userName: newUser 
    }
}

// Seed a new match: sets the opponent deck for this match and clears any prior result.
// The player deck is not passed here; it persists in state (starter on first run).
export function startMatchAction(opponentDeck){
  return {
    type: START_MATCH,
    opponentDeck
  }
}

// Record the completed match outcome and per-side claimed pairs.
export function recordResultAction(outcome, claimedPairs){
  return {
    type: RECORD_RESULT,
    outcome,          // 'player' | 'opponent' | 'draw'
    claimedPairs      // { player: number, opponent: number }
  }
}

// Steal a card into the player deck after a win.
// removeName is optional; provide it when the deck is full and a swap is required.
export function stealCardAction(addName, removeName){
  return {
    type: STEAL_CARD,
    addName,
    removeName
  }
}

// Clear the stored match result (e.g. when leaving the result screen).
export function resetResultAction(){
  return {
    type: RESET_RESULT
  }
}

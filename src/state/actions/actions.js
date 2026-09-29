export const REGISTER = 'REGISTER'
export const START_MATCH = 'START_MATCH'
export const RECORD_RESULT = 'RECORD_RESULT'
export const STEAL_CARD = 'STEAL_CARD'
export const RESET_RESULT = 'RESET_RESULT'
export const TAKE_MODIFIER = 'TAKE_MODIFIER'
export const BUY_MODIFIER = 'BUY_MODIFIER'
export const BUY_CARD = 'BUY_CARD'
export const SET_DIFFICULTY = 'SET_DIFFICULTY'

export function registerUserAction(newUser){
  return {
    type: REGISTER,
    userName: newUser 
    }
}

// Set the player-selected global difficulty level (0 easy, 1 normal, 2 hard).
export function setDifficultyAction(level){
  return {
    type: SET_DIFFICULTY,
    level
  }
}

// Seed a new match: sets the opponent deck and the opponent's modifier (if any)
// for this match and clears any prior result. The player deck and player modifier
// persist in state (starter deck / empty slot on first run).
export function startMatchAction(opponentDeck, opponentModifier){
  return {
    type: START_MATCH,
    opponentDeck,
    opponentModifier: opponentModifier || null
  }
}

// Record the completed match outcome, per-side claimed pairs, and the names the
// player claimed (used to award points). Points are awarded here on any outcome.
export function recordResultAction(outcome, claimedPairs, playerClaimedNames){
  return {
    type: RECORD_RESULT,
    outcome,                                  // 'player' | 'opponent' | 'draw'
    claimedPairs,                             // { player: number, opponent: number }
    playerClaimedNames: playerClaimedNames || []  // string[] claimed by the player
  }
}

// Take a modifier into the player slot (from winning). removeCurrent=true means
// swap out the currently held modifier; otherwise it only fills an empty slot.
export function takeModifierAction(modifier, removeCurrent){
  return {
    type: TAKE_MODIFIER,
    modifier,                 // { id, tier }
    removeCurrent: !!removeCurrent
  }
}

// Buy a modifier from the marketplace at its tier price. removeCurrent=true
// swaps out the held modifier when the slot is full.
export function buyModifierAction(modifier, removeCurrent){
  return {
    type: BUY_MODIFIER,
    modifier,                 // { id, tier }
    removeCurrent: !!removeCurrent
  }
}

// Buy a Pokemon card into the player's deck. removeName is required when the
// deck is full (keep-or-swap); omit it when there is room.
export function buyCardAction(addName, removeName){
  return {
    type: BUY_CARD,
    addName,
    removeName
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

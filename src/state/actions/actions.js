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

// --- Vat game (MVP) ----------------------------------------------------------
export const VAT_NEW_RUN = 'VAT_NEW_RUN'
export const VAT_CONFIRM_SPAWN = 'VAT_CONFIRM_SPAWN'
export const VAT_CHOOSE_SIGNAL = 'VAT_CHOOSE_SIGNAL'
export const VAT_CONFIRM_LOADOUT = 'VAT_CONFIRM_LOADOUT'
export const VAT_START_WAKE = 'VAT_START_WAKE'
export const VAT_RECORD_DUEL = 'VAT_RECORD_DUEL'
export const VAT_STEAL = 'VAT_STEAL'
export const VAT_CONTINUE = 'VAT_CONTINUE'
export const VAT_MERGE = 'VAT_MERGE'
export const VAT_SET_HAND = 'VAT_SET_HAND'
export const VAT_BUY_BONUS = 'VAT_BUY_BONUS'

// Start a new vat game from a seed (all run randomness derives from it).
export function vatNewRunAction(seed){
  return { type: VAT_NEW_RUN, seed }
}

// Take over the offered Sleeper: indexes of the picked fragments and bonus cards.
export function vatConfirmSpawnAction(fragmentIndexes, bonusIndexes){
  return { type: VAT_CONFIRM_SPAWN, fragmentIndexes, bonusIndexes }
}

// Travel to a Sleeper on the map and duel it, by its npc id.
export function vatChooseSignalAction(npcId){
  return { type: VAT_CHOOSE_SIGNAL, npcId }
}

// Bring these fragments to the duel: indexes into the run's fragments.
export function vatConfirmLoadoutAction(fragmentIndexes){
  return { type: VAT_CONFIRM_LOADOUT, fragmentIndexes }
}

// Begin the Wake Attempt (Lucidity 6 only).
export function vatStartWakeAction(){
  return { type: VAT_START_WAKE }
}

// Record a finished duel: { outcome, scores, supplied }.
export function vatRecordDuelAction(duel){
  return { type: VAT_RECORD_DUEL, duel }
}

// Steal after a win. kind is 'fragment' | 'bonus' | 'anchor'; a bonus card goes to storage when the hand is full.
export function vatStealAction(kind, index){
  return { type: VAT_STEAL, kind, index }
}

// Leave the result screen (respawn after a death, next wake stage, or back to the map).
export function vatContinueAction(){
  return { type: VAT_CONTINUE }
}

// Merge 2 equal fragments of { type, tier } into the next tier.
export function vatMergeAction(type, tier){
  return { type: VAT_MERGE, fragmentType: type, tier }
}

// Choose the hand: the bonus card ids to take into duels (the rest stay in storage).
export function vatSetHandAction(ids){
  return { type: VAT_SET_HAND, ids }
}

// Buy a bonus card from the shop with points, by id.
export function vatBuyBonusAction(id){
  return { type: VAT_BUY_BONUS, id }
}

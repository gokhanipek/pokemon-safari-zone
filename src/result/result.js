import React from 'react'
import { Redirect, Link } from 'react-router-dom'
import { connect } from 'react-redux'

import { eligibleSteals, isDeckFull } from './../game/deck'
import { MODIFIERS } from './../game/modifiers'
import { stealCardAction, takeModifierAction, resetResultAction } from './../state/actions/actions'

import 'bootstrap/dist/css/bootstrap.css';

// Single match-result view: outcome + per-side pairs + points earned.
// On a player win: offers a card steal (keep-or-swap when deck full) and, if the
// opponent held a modifier, offers to take it (keep-or-swap on a full slot).
class Result extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedSteal: null,     // opponent pokemon chosen to add
      selectedRemove: null,    // player pokemon chosen to drop (full-deck swap)
      cardTaken: false,        // card reward resolved
      modifierChoice: null,    // 'take' | 'keep' for the modifier keep-or-swap
      done: false,
      goHome: false,
    }
  }

  componentWillUnmount() {
    this.props.resetResult()
  }

  confirmSteal() {
    const { selectedSteal, selectedRemove } = this.state
    if (!selectedSteal) return
    this.props.stealCard(selectedSteal, selectedRemove || undefined)
    this.setState({ cardTaken: true })
  }

  confirmModifier(removeCurrent) {
    this.props.takeModifier(this.props.opponentModifier, removeCurrent)
    this.setState({ modifierChoice: 'take' })
  }

  render() {
    const { result, playerDeck, playerModifier, opponentDeck, opponentModifier } = this.props

    if (!result) {
      return <Redirect to={{ pathname: '/' }} />
    }
    if (this.state.goHome) {
      return <Redirect to={{ pathname: '/' }} />
    }
    if (this.state.done) {
      return <Redirect to={{ pathname: '/lobby' }} />
    }

    const { outcome, claimedPairs, pointsEarned } = result
    const won = outcome === 'player'
    const heading =
      outcome === 'player' ? 'You win!'
      : outcome === 'opponent' ? 'You lost.'
      : "It's a draw."

    const steals = won && opponentDeck ? eligibleSteals(playerDeck, opponentDeck) : []
    const deckFull = isDeckFull(playerDeck)
    const needsSwap = won && deckFull && steals.length > 0
    const canConfirm =
      this.state.selectedSteal && (!needsSwap || this.state.selectedRemove)

    // Modifier reward: only on a win and only if the opponent held one.
    const modReward = won ? opponentModifier : null
    const modDef = modReward ? MODIFIERS[modReward.id] : null
    const slotFull = !!playerModifier
    const modResolved = this.state.modifierChoice !== null

    return (
      <div className="w-100 py-3 justify-content-center">
        <div className="w-75 mx-auto text-center">
          <h3>{heading}</h3>
          <p className="font-weight-bold">
            You: {claimedPairs.player} pairs &mdash; Opponent: {claimedPairs.opponent} pairs
          </p>
          <p className="font-weight-bold">
            Points earned: <strong>{pointsEarned}</strong>
            {' '}&mdash;{' '}
            Balance: <strong>{this.props.points}</strong>
          </p>

          {won && steals.length > 0 && !this.state.cardTaken && (
            <div className="my-3">
              <h5>Choose a card to take from your opponent</h5>
              <div className="d-flex flex-wrap justify-content-center">
                {steals.map((name) => (
                  <div
                    key={name}
                    onClick={() => this.setState({ selectedSteal: name })}
                    style={{
                      cursor: 'pointer', margin: '6px', padding: '4px', borderRadius: '8px',
                      border: this.state.selectedSteal === name ? '3px solid #2e7d32' : '3px solid transparent',
                    }}>
                    <img alt={name} style={{ width: '80px' }} src={`${process.env.PUBLIC_URL}/img/${name}.png`} />
                    <div>{name}</div>
                  </div>
                ))}
              </div>

              {needsSwap && (
                <div className="my-3">
                  <h6>Your deck is full. Choose a card to release:</h6>
                  <div className="d-flex flex-wrap justify-content-center">
                    {playerDeck.pokemon.map((name) => (
                      <div
                        key={name}
                        onClick={() => this.setState({ selectedRemove: name })}
                        style={{
                          cursor: 'pointer', margin: '6px', padding: '4px', borderRadius: '8px',
                          border: this.state.selectedRemove === name ? '3px solid #c62828' : '3px solid transparent',
                        }}>
                        <img alt={name} style={{ width: '80px' }} src={`${process.env.PUBLIC_URL}/img/${name}.png`} />
                        <div>{name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button className="btn btn-danger m-2 text-white" disabled={!canConfirm} onClick={() => this.confirmSteal()}>
                Take card
              </button>
            </div>
          )}

          {won && steals.length === 0 && (
            <p>No new cards to take from this opponent.</p>
          )}

          {modReward && !modResolved && (
            <div className="my-3">
              <h5>Your opponent dropped a modifier: {modDef ? modDef.label : modReward.id} (tier {modReward.tier})</h5>
              {!slotFull ? (
                <button className="btn btn-warning m-2" onClick={() => this.confirmModifier(false)}>
                  Take modifier
                </button>
              ) : (
                <div>
                  <p>You already hold {MODIFIERS[playerModifier.id] ? MODIFIERS[playerModifier.id].label : playerModifier.id} (tier {playerModifier.tier}). Keep it or swap?</p>
                  <button className="btn btn-outline-secondary m-2" onClick={() => this.setState({ modifierChoice: 'keep' })}>
                    Keep current
                  </button>
                  <button className="btn btn-warning m-2" onClick={() => this.confirmModifier(true)}>
                    Swap to new
                  </button>
                </div>
              )}
            </div>
          )}

          <div>
            <button className="btn btn-secondary m-2 text-white" onClick={() => this.setState({ done: true })}>
              Play again
            </button>
            <Link to={'/shop'} className="btn btn-info m-2 text-white">Shop</Link>
            <button className="btn btn-outline-secondary m-2" onClick={() => this.setState({ goHome: true })}>
              Home
            </button>
          </div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  result: state.safariZoneReducer.result,
  playerDeck: state.safariZoneReducer.playerDeck,
  playerModifier: state.safariZoneReducer.playerModifier,
  points: state.safariZoneReducer.points,
  opponentDeck: state.safariZoneReducer.opponentDeck,
  opponentModifier: state.safariZoneReducer.opponentModifier,
})

const mapDispatchToProps = (dispatch) => ({
  stealCard: (addName, removeName) => dispatch(stealCardAction(addName, removeName)),
  takeModifier: (modifier, removeCurrent) => dispatch(takeModifierAction(modifier, removeCurrent)),
  resetResult: () => dispatch(resetResultAction()),
})

export default connect(mapStateToProps, mapDispatchToProps)(Result)

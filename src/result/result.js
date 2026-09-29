import React from 'react'
import { Redirect } from 'react-router-dom'
import { connect } from 'react-redux'

import { eligibleSteals, isDeckFull } from './../game/deck'
import { stealCardAction, resetResultAction } from './../state/actions/actions'

import 'bootstrap/dist/css/bootstrap.css';

// Single match-result view: shows outcome + per-side pairs.
// On a player win, offers a card steal (with a swap step when the deck is full).
class Result extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedSteal: null,   // opponent pokemon chosen to add
      selectedRemove: null,  // player pokemon chosen to drop (full-deck swap)
      done: false,           // steal completed / skipped -> go play again
      goHome: false,
    }
  }

  componentWillUnmount() {
    // Leaving the result screen clears the stored result.
    this.props.resetResult()
  }

  confirmSteal() {
    const { selectedSteal, selectedRemove } = this.state
    if (!selectedSteal) return
    this.props.stealCard(selectedSteal, selectedRemove || undefined)
    this.setState({ done: true })
  }

  render() {
    const { result, playerDeck, opponentDeck } = this.props

    // No result in state (e.g. direct navigation) -> back home.
    if (!result) {
      return <Redirect to={{ pathname: '/' }} />
    }
    if (this.state.goHome) {
      return <Redirect to={{ pathname: '/' }} />
    }
    if (this.state.done) {
      return <Redirect to={{ pathname: '/SafariZone' }} />
    }

    const { outcome, claimedPairs } = result
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

    return (
      <div className="w-100 py-3 justify-content-center">
        <div className="w-75 mx-auto text-center">
          <h3>{heading}</h3>
          <p className="font-weight-bold">
            You: {claimedPairs.player} pairs &mdash; Opponent: {claimedPairs.opponent} pairs
          </p>

          {won && steals.length > 0 && (
            <div className="my-3">
              <h5>Choose a card to take from your opponent</h5>
              <div className="d-flex flex-wrap justify-content-center">
                {steals.map((name) => (
                  <div
                    key={name}
                    onClick={() => this.setState({ selectedSteal: name })}
                    style={{
                      cursor: 'pointer',
                      margin: '6px',
                      padding: '4px',
                      borderRadius: '8px',
                      border:
                        this.state.selectedSteal === name
                          ? '3px solid #2e7d32'
                          : '3px solid transparent',
                    }}>
                    <img
                      alt={name}
                      style={{ width: '80px' }}
                      src={`${process.env.PUBLIC_URL}/img/${name}.png`}
                    />
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
                          cursor: 'pointer',
                          margin: '6px',
                          padding: '4px',
                          borderRadius: '8px',
                          border:
                            this.state.selectedRemove === name
                              ? '3px solid #c62828'
                              : '3px solid transparent',
                        }}>
                        <img
                          alt={name}
                          style={{ width: '80px' }}
                          src={`${process.env.PUBLIC_URL}/img/${name}.png`}
                        />
                        <div>{name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                className="btn btn-danger m-2 text-white"
                disabled={!canConfirm}
                onClick={() => this.confirmSteal()}>
                Take card &amp; play again
              </button>
            </div>
          )}

          {won && steals.length === 0 && (
            <p>No new cards to take from this opponent.</p>
          )}

          <div>
            <button
              className="btn btn-secondary m-2 text-white"
              onClick={() => this.setState({ done: true })}>
              Play again
            </button>
            <button
              className="btn btn-outline-secondary m-2"
              onClick={() => this.setState({ goHome: true })}>
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
  opponentDeck: state.safariZoneReducer.opponentDeck,
})

const mapDispatchToProps = (dispatch) => ({
  stealCard: (addName, removeName) => dispatch(stealCardAction(addName, removeName)),
  resetResult: () => dispatch(resetResultAction()),
})

export default connect(mapStateToProps, mapDispatchToProps)(Result)

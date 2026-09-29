import React from 'react'
import { Redirect, Link } from 'react-router-dom'
import { connect } from 'react-redux'

import { getOpponents } from './../game/opponents'
import { MODIFIERS } from './../game/modifiers'
import { FIRST_DAY, CAMPAIGN_LENGTH_DAYS } from './../game/campaign'
import { startMatchAction } from './../state/actions/actions'

import 'bootstrap/dist/css/bootstrap.css';

// Pre-match lobby: shows the player's loadout and a roster of opponents.
// Selecting one seeds the match and navigates to the board.
class Lobby extends React.Component {
  constructor(props) {
    super(props)
    this.state = { go: false }
  }

  choose(opponent) {
    this.props.startMatch(opponent.deck, opponent.modifier)
    this.setState({ go: true })
  }

  modifierLabel(mod) {
    if (!mod) return 'none'
    const def = MODIFIERS[mod.id]
    return `${def ? def.label : mod.id} (tier ${mod.tier})`
  }

  render() {
    if (this.state.go) {
      return <Redirect to={{ pathname: '/SafariZone' }} />
    }

    const { playerDeck, playerModifier, points, day, released } = this.props
    const opponents = getOpponents()

    return (
      <div className="container safari-zone pt-3">
        <div className="w-100 text-center">
          <p className="font-weight-bold text-uppercase text-muted mb-1">
            Day {Math.min(day, CAMPAIGN_LENGTH_DAYS)} of {CAMPAIGN_LENGTH_DAYS}
          </p>

          {day === FIRST_DAY && !released && (
            <p className="text-justify font-italic">
              First day in the asylum. You notice the inmates passing time over a memory
              duel and a stranger presses a starter deck into your hands. Survive the {CAMPAIGN_LENGTH_DAYS} days
              and you walk free.
            </p>
          )}

          {released && (
            <div className="alert alert-success" role="alert">
              <strong>Released.</strong> You made it through all {CAMPAIGN_LENGTH_DAYS} days and walk out of the asylum a free trainer.
            </div>
          )}

          <h3 className="font-weight-bold">Choose your opponent</h3>

          <div className="my-3">
            <h5>Your loadout</h5>
            <p className="font-weight-bold">
              Deck: {playerDeck.pokemon.join(', ')}
            </p>
            <p className="font-weight-bold">
              Modifier: {this.modifierLabel(playerModifier)} &mdash; Points: {points}
            </p>
          </div>

          <div className="d-flex flex-wrap justify-content-center">
            {opponents.map((o) => (
              <div key={o.id} className="border rounded p-3 m-2" style={{ minWidth: '200px' }}>
                <h5>{o.name}</h5>
                <p className="small mb-1">Deck: {o.deck.pokemon.join(', ')}</p>
                <p className="small">Modifier: {this.modifierLabel(o.modifier)}</p>
                <button className="btn btn-success btn-sm" onClick={() => this.choose(o)}>
                  Challenge
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <Link to={'/shop'} className="btn btn-info m-2 text-white">Shop</Link>
            <Link to={'/'} className="btn btn-outline-secondary m-2">Home</Link>
          </div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  playerDeck: state.safariZoneReducer.playerDeck,
  playerModifier: state.safariZoneReducer.playerModifier,
  points: state.safariZoneReducer.points,
  day: state.safariZoneReducer.day,
  released: state.safariZoneReducer.released,
})

const mapDispatchToProps = (dispatch) => ({
  startMatch: (deck, modifier) => dispatch(startMatchAction(deck, modifier)),
})

export default connect(mapStateToProps, mapDispatchToProps)(Lobby)

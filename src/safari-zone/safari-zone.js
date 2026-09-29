import React from 'react';
import Pokemon from './../pokemon/pokemon'
import { Redirect } from 'react-router-dom'
import { connect } from 'react-redux'

import { createMatch, flip, resolve, canFlip, matchOutcome } from './../game/matchMachine'
import { chooseOpponentFlip, rememberCard } from './../game/opponent'
import { createOpponentDeck } from './../game/deck'
import { startMatchAction, recordResultAction } from './../state/actions/actions'

import 'bootstrap/dist/css/bootstrap.css';
import './safari-zone.css'

const REVEAL_MS = 800;      // how long a resolved pair/miss stays visible
const OPPONENT_MS = 700;    // delay before each opponent flip

class SafariZone extends React.Component {
  constructor(props) {
    super(props)
    // Use the opponent deck from Redux if present, otherwise fall back to the
    // default. The Redux dispatch happens in componentDidMount (not in render).
    this.matchOpponentDeck = props.opponentDeck || createOpponentDeck()
    this.state = {
      match: createMatch(props.playerDeck, this.matchOpponentDeck),
      opponentSeen: {},   // opponent memory: cardId -> name
      recorded: false,    // guard so we dispatch the result only once
    }
    this.timers = []
    this.handleClick = this.handleClick.bind(this)
  }

  componentDidMount() {
    document.body.style.backgroundImage = `url('${process.env.PUBLIC_URL}/img/grass.png')`;
    // Persist the opponent deck for this match and clear any prior result.
    this.props.startMatch(this.matchOpponentDeck)
    this.maybeDriveOpponent()
  }

  componentWillUnmount() {
    document.body.style.backgroundImage = '';
    this.clearTimers()
  }

  clearTimers() {
    this.timers.forEach((t) => clearTimeout(t))
    this.timers = []
  }

  schedule(fn, ms) {
    const t = setTimeout(fn, ms)
    this.timers.push(t)
  }

  // Record opponent-visible cards into its memory whenever a card is face-up.
  rememberFaceUp(match) {
    let seen = this.state.opponentSeen
    match.grid.forEach((p) => {
      if (p.faceUp) {
        seen = rememberCard(seen, p)
      }
    })
    return seen
  }

  // Player clicks a card.
  handleClick(cardId) {
    const { match } = this.state
    if (match.activePlayer !== 'player') return
    if (!canFlip(match, cardId)) return

    const flipped = flip(match, cardId)
    const seen = this.rememberFaceUp(flipped)
    this.setState({ match: flipped, opponentSeen: seen }, () => {
      if (this.state.match.phase === 'resolving') {
        this.schedule(() => this.doResolve(), REVEAL_MS)
      }
    })
  }

  // Resolve the two flipped cards, then continue the flow.
  doResolve() {
    const resolved = resolve(this.state.match)
    this.setState({ match: resolved }, () => {
      this.afterAdvance()
    })
  }

  // After any advance, either end the match, drive the opponent, or wait for the player.
  afterAdvance() {
    const { match } = this.state
    if (match.phase === 'ended') {
      this.recordResult(match)
      return
    }
    this.maybeDriveOpponent()
  }

  recordResult(match) {
    if (this.state.recorded) return
    const outcome = matchOutcome(match)
    this.setState({ recorded: true })
    this.props.recordResult(outcome, match.claimedPairs)
  }

  // If it's the opponent's turn, schedule its next flip.
  maybeDriveOpponent() {
    const { match } = this.state
    if (match.phase === 'ended') return
    if (match.activePlayer !== 'opponent') return
    if (match.phase !== 'awaitingFirst' && match.phase !== 'awaitingSecond') return

    this.schedule(() => this.opponentFlip(), OPPONENT_MS)
  }

  opponentFlip() {
    const { match, opponentSeen } = this.state
    if (match.activePlayer !== 'opponent') return

    const cardId = chooseOpponentFlip(match, opponentSeen)
    if (cardId === null) return

    const flipped = flip(match, cardId)
    const seen = this.rememberFaceUp(flipped)
    this.setState({ match: flipped, opponentSeen: seen }, () => {
      if (this.state.match.phase === 'resolving') {
        this.schedule(() => this.doResolve(), REVEAL_MS)
      } else {
        // opponent still needs its second flip
        this.maybeDriveOpponent()
      }
    })
  }

  render() {
    const { match } = this.state

    // When the match has ended, hand off to the result screen.
    if (match.phase === 'ended') {
      return <Redirect to={{ pathname: '/result' }} />
    }

    const turnLabel = match.activePlayer === 'player' ? 'Your turn' : "Opponent's turn"

    return (
      <div className="container safari-zone pt-3">
        <div className="justify-content-center">
          <div className="col col-12 align-self-center">
            <div className="bs-component">
              <h3 className="font-weight-bold">
                Hello {this.props.userName ? this.props.userName : 'Stranger!'}
              </h3>
              <p className="font-weight-bold">
                <span className={match.activePlayer === 'player' ? 'text-success' : 'text-danger'}>
                  {turnLabel}
                </span>
              </p>
              <p className="font-weight-bold">
                You: <strong>{match.claimedPairs.player}</strong> pairs
                {' '}&mdash;{' '}
                Opponent: <strong>{match.claimedPairs.opponent}</strong> pairs
              </p>
              <div className="row">
                {match.grid.map((pos) => (
                  <Pokemon
                    key={pos.cardId}
                    pokemon={pos.name}
                    faceUp={pos.faceUp}
                    claimedBy={pos.claimedBy}
                    click={() => this.handleClick(pos.cardId)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  userName: state.safariZoneReducer.userName,
  playerDeck: state.safariZoneReducer.playerDeck,
  opponentDeck: state.safariZoneReducer.opponentDeck,
})

const mapDispatchToProps = (dispatch) => ({
  startMatch: (opponentDeck) => dispatch(startMatchAction(opponentDeck)),
  recordResult: (outcome, claimedPairs) => dispatch(recordResultAction(outcome, claimedPairs)),
})

export default connect(mapStateToProps, mapDispatchToProps)(SafariZone)

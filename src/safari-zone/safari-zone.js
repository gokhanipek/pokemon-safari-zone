import React from 'react';
import Pokemon from './../pokemon/pokemon'
import { Redirect } from 'react-router-dom'
import { connect } from 'react-redux'

import {
  createMatch, flip, resolve, canFlip, matchOutcome,
  queueTurnEffect, reshuffle, expireTurn,
} from './../game/matchMachine'
import { chooseOpponentFlip, rememberCard, chooseOpponentModifierTrigger, memoryCapacity } from './../game/opponent'
import { createOpponentDeck } from './../game/deck'
import {
  MODIFIERS, BLIND_SPOT, SPEED_ROUND, CHAOS,
  blindSpotRevealSeconds, speedRoundLimitSeconds,
} from './../game/modifiers'
import { startMatchAction, recordResultAction } from './../state/actions/actions'

import 'bootstrap/dist/css/bootstrap.css';
import './safari-zone.css'

const OPPONENT_MS = 700;    // delay before each opponent flip

// The default opponent carries a modifier so a first-time player can win one.
const DEFAULT_OPPONENT_MODIFIER = { id: CHAOS, tier: 1 };

class SafariZone extends React.Component {
  constructor(props) {
    super(props)
    // Fall back to a default opponent (deck + modifier) when Redux has not
    // seeded one yet, so the modifier-steal path is reachable in play.
    this.matchOpponentDeck = props.opponentDeck || createOpponentDeck()
    this.matchOpponentModifier = props.opponentDeck
      ? props.opponentModifier
      : DEFAULT_OPPONENT_MODIFIER
    // Opponent memory capacity for this match: difficulty level + opponent's
    // modifier tier (a missing modifier contributes 0).
    this.memoryCap = memoryCapacity(
      props.difficulty,
      this.matchOpponentModifier ? this.matchOpponentModifier.tier : 0
    )
    this.state = {
      match: createMatch(props.playerDeck, this.matchOpponentDeck),
      opponentSeen: {},          // opponent memory: cardId -> name
      recorded: false,           // guard so we dispatch the result only once
      playerTriggered: false,    // player has fired their modifier this match
      opponentTriggered: false,  // opponent has fired its modifier this match
      speedTimerId: null,        // active Speed Round expiry timer id
    }
    this.timers = []
    this.handleClick = this.handleClick.bind(this)
    this.triggerPlayerModifier = this.triggerPlayerModifier.bind(this)
  }

  componentDidMount() {
    document.body.style.backgroundImage = `url('${process.env.PUBLIC_URL}/img/grass.png')`;
    this.props.startMatch(this.matchOpponentDeck, this.matchOpponentModifier)
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
    return t
  }

  rememberFaceUp(match) {
    let seen = this.state.opponentSeen
    match.grid.forEach((p) => {
      if (p.faceUp) {
        seen = rememberCard(seen, p, this.memoryCap)
      }
    })
    return seen
  }

  // Reveal duration (ms) for the current turn - honors an active Blind Spot.
  revealMsFor(match) {
    return match.revealMs
  }

  // Clear a pending Speed Round expiry timer, if any.
  clearSpeedTimer() {
    if (this.state.speedTimerId) {
      clearTimeout(this.state.speedTimerId)
      this.setState({ speedTimerId: null })
    }
  }

  // If the turn that is starting has a Speed Round limit, arm an expiry timer.
  // Only arm once per limited turn (do not reset on a kept-turn match).
  armSpeedTimerIfNeeded(match) {
    if (match.phase !== 'awaitingFirst') return
    if (typeof match.turnLimitMs !== 'number' || match.turnLimitMs <= 0) return
    if (this.state.speedTimerId) return // already counting down this turn
    const id = this.schedule(() => this.onSpeedExpire(), match.turnLimitMs)
    this.setState({ speedTimerId: id })
  }

  onSpeedExpire() {
    // End the current turn early; clear the timer id.
    const expired = expireTurn(this.state.match)
    this.setState({ match: expired, speedTimerId: null }, () => {
      this.afterAdvance()
    })
  }

  // Player triggers their held modifier (once per match, on their turn boundary).
  triggerPlayerModifier() {
    const { match } = this.state
    const mod = this.props.playerModifier
    if (!mod) return
    if (this.state.playerTriggered) return
    if (match.activePlayer !== 'player') return
    if (match.phase !== 'awaitingFirst' || match.flippedThisTurn.length !== 0) return

    this.applyModifier(mod, () => this.setState({ playerTriggered: true }))
  }

  // Apply a modifier's effect to the current match state.
  applyModifier(mod, done) {
    const { match } = this.state
    let next = match
    if (mod.id === CHAOS) {
      next = reshuffle(match)
    } else if (mod.id === BLIND_SPOT) {
      next = queueTurnEffect(match, { revealMs: blindSpotRevealSeconds(mod.tier) * 1000 })
    } else if (mod.id === SPEED_ROUND) {
      next = queueTurnEffect(match, { turnLimitMs: speedRoundLimitSeconds(mod.tier) * 1000 })
    }
    this.setState({ match: next }, done)
  }

  handleClick(cardId) {
    const { match } = this.state
    if (match.activePlayer !== 'player') return
    if (!canFlip(match, cardId)) return

    const flipped = flip(match, cardId)
    const seen = this.rememberFaceUp(flipped)
    this.setState({ match: flipped, opponentSeen: seen }, () => {
      if (this.state.match.phase === 'resolving') {
        this.clearSpeedTimer()
        this.schedule(() => this.doResolve(), this.revealMsFor(this.state.match))
      }
    })
  }

  doResolve() {
    const before = this.state.match
    const resolved = resolve(before)
    // A miss passes the turn - clear any Speed Round timer so the next limited
    // turn arms fresh. A match keeps the turn, so leave the timer running.
    if (resolved.lastOutcome === 'miss') {
      this.clearSpeedTimer()
    }
    this.setState({ match: resolved }, () => {
      this.afterAdvance()
    })
  }

  afterAdvance() {
    const { match } = this.state
    if (match.phase === 'ended') {
      this.recordResult(match)
      return
    }
    // A new turn may have begun (miss/expire). Arm a Speed Round timer if the
    // freshly-begun turn carries a limit.
    this.armSpeedTimerIfNeeded(match)
    this.maybeDriveOpponent()
  }

  recordResult(match) {
    if (this.state.recorded) return
    const outcome = matchOutcome(match)
    this.setState({ recorded: true })
    this.props.recordResult(outcome, match.claimedPairs, match.claimedNames.player)
  }

  maybeDriveOpponent() {
    const { match } = this.state
    if (match.phase === 'ended') return
    if (match.activePlayer !== 'opponent') return
    if (match.phase !== 'awaitingFirst' && match.phase !== 'awaitingSecond') return

    // Opponent may trigger its modifier at a fresh boundary before flipping.
    if (
      match.phase === 'awaitingFirst' &&
      match.flippedThisTurn.length === 0 &&
      chooseOpponentModifierTrigger(match, this.matchOpponentModifier, this.state.opponentTriggered)
    ) {
      this.schedule(() => this.opponentTrigger(), OPPONENT_MS)
      return
    }

    this.schedule(() => this.opponentFlip(), OPPONENT_MS)
  }

  opponentTrigger() {
    if (this.state.match.activePlayer !== 'opponent') return
    this.applyModifier(this.matchOpponentModifier, () => {
      this.setState({ opponentTriggered: true }, () => {
        // Chaos keeps the opponent's turn; a queued effect targets the player's
        // next turn. Either way, continue driving the opponent's flips.
        this.armSpeedTimerIfNeeded(this.state.match)
        this.maybeDriveOpponent()
      })
    })
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
        this.clearSpeedTimer()
        this.schedule(() => this.doResolve(), this.revealMsFor(this.state.match))
      } else {
        this.maybeDriveOpponent()
      }
    })
  }

  renderModifierBar() {
    const mod = this.props.playerModifier
    const { match } = this.state
    if (!mod) return null
    const def = MODIFIERS[mod.id]
    const label = def ? def.label : mod.id
    const canTrigger =
      !this.state.playerTriggered &&
      match.activePlayer === 'player' &&
      match.phase === 'awaitingFirst' &&
      match.flippedThisTurn.length === 0
    return (
      <p className="font-weight-bold">
        Modifier: <strong>{label}</strong> (tier {mod.tier}){' '}
        {this.state.playerTriggered ? (
          <span className="text-muted">used</span>
        ) : (
          <button
            className="btn btn-sm btn-warning"
            disabled={!canTrigger}
            onClick={this.triggerPlayerModifier}>
            Trigger
          </button>
        )}
      </p>
    )
  }

  render() {
    const { match } = this.state

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
              {this.renderModifierBar()}
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
  difficulty: state.safariZoneReducer.difficulty,
  playerDeck: state.safariZoneReducer.playerDeck,
  playerModifier: state.safariZoneReducer.playerModifier,
  opponentDeck: state.safariZoneReducer.opponentDeck,
  opponentModifier: state.safariZoneReducer.opponentModifier,
})

const mapDispatchToProps = (dispatch) => ({
  startMatch: (opponentDeck, opponentModifier) => dispatch(startMatchAction(opponentDeck, opponentModifier)),
  recordResult: (outcome, claimedPairs, playerClaimedNames) =>
    dispatch(recordResultAction(outcome, claimedPairs, playerClaimedNames)),
})

export default connect(mapStateToProps, mapDispatchToProps)(SafariZone)

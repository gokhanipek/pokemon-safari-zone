import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'

import { MODIFIERS, MODIFIER_IDS, MIN_TIER, MAX_TIER } from './../game/modifiers'
import { modifierPrice, cardPrice, MARKET_CARDS } from './../game/economy'
import { isDeckFull } from './../game/deck'
import { buyModifierAction, buyCardAction } from './../state/actions/actions'

import 'bootstrap/dist/css/bootstrap.css';

const TIERS = []
for (let t = MIN_TIER; t <= MAX_TIER; t += 1) {
  TIERS.push(t)
}

// The marketplace: spend Asylum Credits (AC) on Pokemon cards for the deck and
// on modifiers at a chosen tier. Card buys are keep-or-swap when the deck is
// full; modifier buys are keep-or-swap when the single slot is full.
class Shop extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedTier: MIN_TIER,   // tier chosen for modifier purchases
      pendingBuy: null,         // modifier id awaiting a full-slot swap decision
      pendingCard: null,        // card name awaiting a full-deck swap decision
    }
  }

  // ----- modifiers -----

  buyModifier(id, removeCurrent) {
    this.props.buyModifier({ id, tier: this.state.selectedTier }, removeCurrent)
    this.setState({ pendingBuy: null })
  }

  onBuyModifierClick(id) {
    if (this.props.playerModifier) {
      // Full slot: ask for keep-or-swap.
      this.setState({ pendingBuy: id })
    } else {
      this.buyModifier(id, false)
    }
  }

  // ----- cards -----

  buyCard(addName, removeName) {
    this.props.buyCard(addName, removeName)
    this.setState({ pendingCard: null })
  }

  onBuyCardClick(name) {
    if (isDeckFull(this.props.playerDeck)) {
      // Full deck: ask which card to release.
      this.setState({ pendingCard: name })
    } else {
      this.buyCard(name, undefined)
    }
  }

  renderModifierSection() {
    const { points, playerModifier } = this.props
    const { selectedTier } = this.state
    const tierPrice = modifierPrice(selectedTier)
    const affordable = points >= tierPrice
    const heldDef = playerModifier ? MODIFIERS[playerModifier.id] : null

    return (
      <div className="my-4">
        <h4>Modifiers</h4>
        <div className="my-2">
          <span className="mr-2">Tier:</span>
          {TIERS.map((t) => (
            <button
              key={t}
              className={`btn btn-sm m-1 ${selectedTier === t ? 'btn-dark' : 'btn-outline-dark'}`}
              onClick={() => this.setState({ selectedTier: t, pendingBuy: null })}>
              {t} ({modifierPrice(t)} AC)
            </button>
          ))}
        </div>
        {playerModifier && (
          <p className="text-muted">
            You currently hold {heldDef ? heldDef.label : playerModifier.id} (tier {playerModifier.tier}).
          </p>
        )}

        <div className="d-flex flex-wrap justify-content-center">
          {MODIFIER_IDS.map((id) => {
            const def = MODIFIERS[id]
            return (
              <div key={id} style={{ margin: '10px', minWidth: '160px' }} className="border rounded p-3">
                <h5>{def.label}</h5>
                {this.state.pendingBuy === id ? (
                  <div>
                    <p className="small">Slot full. Swap for a tier-{selectedTier} {def.label}?</p>
                    <button className="btn btn-sm btn-warning m-1" onClick={() => this.buyModifier(id, true)}>
                      Swap ({tierPrice} AC)
                    </button>
                    <button className="btn btn-sm btn-outline-secondary m-1" onClick={() => this.setState({ pendingBuy: null })}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={!affordable}
                    onClick={() => this.onBuyModifierClick(id)}>
                    Buy tier {selectedTier} ({tierPrice} AC)
                  </button>
                )}
              </div>
            )
          })}
        </div>
        {!affordable && <p className="text-danger mt-2">Not enough AC for a tier-{selectedTier} modifier.</p>}
      </div>
    )
  }

  renderCardSection() {
    const { points, playerDeck } = this.props
    // Only offer Pokemon the player does not already own.
    const forSale = MARKET_CARDS.filter((name) => !playerDeck.pokemon.includes(name))
    const deckFull = isDeckFull(playerDeck)

    return (
      <div className="my-4">
        <h4>Pokemon cards</h4>
        {forSale.length === 0 ? (
          <p className="text-muted">You already own every card on offer.</p>
        ) : (
          <div className="d-flex flex-wrap justify-content-center">
            {forSale.map((name) => {
              const price = cardPrice(name)
              const affordable = points >= price
              return (
                <div key={name} style={{ margin: '10px', width: '160px' }} className="border rounded p-3 text-center">
                  <img alt={name} style={{ width: '80px' }} src={`${process.env.PUBLIC_URL}/img/${name}.png`} />
                  <div className="text-capitalize">{name}</div>
                  {this.state.pendingCard === name ? (
                    <div className="mt-2">
                      <p className="small">Deck full. Release a card to add {name}:</p>
                      <div className="d-flex flex-wrap justify-content-center">
                        {playerDeck.pokemon.map((owned) => (
                          <button
                            key={owned}
                            className="btn btn-sm btn-outline-danger m-1 text-capitalize"
                            onClick={() => this.buyCard(name, owned)}>
                            {owned}
                          </button>
                        ))}
                      </div>
                      <button className="btn btn-sm btn-outline-secondary m-1" onClick={() => this.setState({ pendingCard: null })}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-sm btn-primary mt-2"
                      disabled={!affordable}
                      onClick={() => this.onBuyCardClick(name)}>
                      Buy ({price} AC){deckFull ? ' — swap' : ''}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  render() {
    const { points } = this.props

    return (
      <div className="w-100 py-3 justify-content-center">
        <div className="w-75 mx-auto text-center">
          <h3>Marketplace</h3>
          <p className="font-weight-bold">Balance: <strong>{points}</strong> Asylum Credits (AC)</p>

          {this.renderCardSection()}
          {this.renderModifierSection()}

          <div className="mt-3">
            <Link to={'/lobby'} className="btn btn-success m-2 text-white">Play</Link>
            <Link to={'/'} className="btn btn-outline-secondary m-2">Home</Link>
          </div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  points: state.safariZoneReducer.points,
  playerModifier: state.safariZoneReducer.playerModifier,
  playerDeck: state.safariZoneReducer.playerDeck,
})

const mapDispatchToProps = (dispatch) => ({
  buyModifier: (modifier, removeCurrent) => dispatch(buyModifierAction(modifier, removeCurrent)),
  buyCard: (addName, removeName) => dispatch(buyCardAction(addName, removeName)),
})

export default connect(mapStateToProps, mapDispatchToProps)(Shop)

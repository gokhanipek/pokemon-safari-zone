import React from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import './pokemon.css'

// A single grid card.
// Props:
//   pokemon  - name (image key under public/img/<name>.png)
//   faceUp   - whether the front (pokemon) face is showing
//   claimedBy- 'player' | 'opponent' | null (null = still in play)
//   click    - click handler
export default class Pokemon extends React.Component {
    clicked(pokemon){
      this.props.click(pokemon)
    }
    render(){
      const { pokemon, faceUp, claimedBy } = this.props;
      const revealed = faceUp || claimedBy !== null;
      const className =
        "col col-3 card"
        + (revealed ? ' opened' : '')
        + (claimedBy === 'player' ? ' claimed claimed-player' : '')
        + (claimedBy === 'opponent' ? ' claimed claimed-opponent' : '');

      return (
        <div
          className={className}
          onClick={() => (claimedBy !== null ? null : this.clicked(pokemon))}>
          <div className="front">
            <img className="img-thumbnail" alt="front" src={`${process.env.PUBLIC_URL}/img/pokeball.png`}/>
          </div>
          <div className="back">
            <img alt={pokemon} src={`${process.env.PUBLIC_URL}/img/${pokemon}.png`}/>
          </div>
        </div>
      )
    }
  }

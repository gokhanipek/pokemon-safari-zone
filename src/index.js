import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';
import SafariZone from './safari-zone/safari-zone'
import Home from './home/home'

import { BrowserRouter, Route, Link } from 'react-router-dom';
import Result from './result/result';
import Shop from './shop/shop';
import Lobby from './lobby/lobby';
import { Provider } from 'react-redux'
import { store } from './state/store/store'



import 'bootstrap/dist/css/bootstrap.css';
import './App.css'




ReactDOM.render((  
    <BrowserRouter basename={process.env.PUBLIC_URL}>
    <div className="navbar navbar-light">
      <Link to={'/'}> 
      <img className="mx-auto d-block pokemon-logo" src={`${process.env.PUBLIC_URL}/img/pokemon-logo.png`} alt="Logo" />
      </Link>
    </div>
    <Provider store={store}>
      <Route exact path="/" component={Home} />
      <Route path="/lobby" component={Lobby} />
      <Route path="/SafariZone" component={SafariZone} />
      <Route path="/result" component={Result} />
      <Route path="/shop" component={Shop} />
    </Provider>
    </BrowserRouter>
), document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

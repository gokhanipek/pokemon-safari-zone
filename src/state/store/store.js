import { createStore } from 'redux';
import { allReducers } from './../reducers/reducers'

export const store = createStore(allReducers, 
    window.devToolsExtension && window.devToolsExtension()
);

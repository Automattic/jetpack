/**
 * External dependencies
 */
import { applyMiddleware, createStore } from 'redux';
import refx from 'refx';

/**
 * Internal dependencies
 */
import effects from './effects';
import reducer from './reducer';

const middlewares = [ refx( effects ) ];
const store = createStore( reducer, {}, applyMiddleware( ...middlewares ) );

export default store;

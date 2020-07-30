/**
 * External dependencies
 */
import { applyMiddleware, createStore } from 'redux';
import refx from 'refx';
import {
	createStateSyncMiddleware,
	initStateWithPrevTab,
	withReduxStateSync,
} from 'redux-state-sync';

/**
 * Internal dependencies
 */
import effects from './effects';
import reducer from './reducer';

const middlewares = [ refx( effects ), createStateSyncMiddleware( {} ) ];
const store = createStore( withReduxStateSync( reducer ), {}, applyMiddleware( ...middlewares ) );
initStateWithPrevTab( store );

export default store;

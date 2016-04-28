/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

/**
 * Internal dependencies
 */
import { reducer as modules } from 'state/modules';
import { initialState } from 'state/initial-state';
import { reducer as connection } from 'state/connection';
import { reducer as jumpstart } from 'state/jumpstart';

const jetpackReducer = combineReducers( {
	initialState,
	modules,
	connection,
	jumpstart
} );

export default combineReducers( {
	jetpack: jetpackReducer,
	routing: routerReducer
} );

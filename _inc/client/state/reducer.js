/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

/**
 * Internal dependencies
 */
import { reducer as modules } from 'state/modules';
import { reducer as connection } from 'state/connection';
import { reducer as jumpstart } from 'state/jumpstart';

const jetpackReducer = combineReducers( {
	modules,
	connection,
	jumpstart
} );

export default combineReducers( {
	jetpack: jetpackReducer,
	routing: routerReducer
} );

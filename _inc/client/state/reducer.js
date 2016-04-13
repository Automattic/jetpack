/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

/**
 * Internal dependencies
 */
import { reducer as modules } from 'state/modules';

const jetpackReducer = combineReducers( {
	modules
} );

export default combineReducers( {
	jetpack: jetpackReducer,
	routing: routerReducer
} );

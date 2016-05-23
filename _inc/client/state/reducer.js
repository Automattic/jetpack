/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

/**
 * Internal dependencies
 */
import { initialState } from 'state/initial-state';
import { dashboard } from 'state/at-a-glance';
import { reducer as modules } from 'state/modules';
import { reducer as connection } from 'state/connection';
import { reducer as jumpstart } from 'state/jumpstart';
import { reducer as settings } from 'state/settings';
import { reducer as siteData } from 'state/site';

const jetpackReducer = combineReducers( {
	initialState,
	dashboard,
	modules,
	connection,
	jumpstart,
	settings,
	siteData
} );

export default combineReducers( {
	jetpack: jetpackReducer,
	routing: routerReducer
} );

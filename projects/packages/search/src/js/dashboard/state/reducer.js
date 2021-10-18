/**
 * External dependencies
 */
import { combineReducers } from 'redux';

/**
 * Internal dependencies
 */
import { initialState } from 'state/initial-state/reducer';
import { reducer as connection } from 'state/connection/reducer';
import { reducer as modules } from 'state/modules/reducer';
import { reducer as settings } from 'state/settings/reducer';
import { reducer as siteData } from 'state/site/reducer';

const jetpackReducer = combineReducers( {
	connection,
	initialState,
	modules,
	settings,
	siteData,
} );

export default combineReducers( {
	jetpack: jetpackReducer,
} );

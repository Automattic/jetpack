/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import { globalNotices } from 'components/global-notices/state/notices/reducer';

/**
 * Internal dependencies
 */
import { initialState } from 'state/initial-state/reducer';
import { reducer as connection } from 'state/connection/reducer';
import { reducer as siteData } from 'state/site/reducer';

const jetpackReducer = combineReducers( {
	initialState,
	connection,
	siteData,
} );

export default combineReducers( {
	globalNotices: globalNotices,
	jetpack: jetpackReducer,
} );

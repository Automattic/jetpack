/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import { globalNotices } from 'components/global-notices/state/notices/reducer';

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
import { reducer as pluginsData } from 'state/site/plugins';
import { reducer as jetpackNotices } from 'state/jetpack-notices';
import { reducer as search } from 'state/search';
import { reducer as devCard } from 'state/dev-version';

const jetpackReducer = combineReducers( {
	initialState,
	dashboard,
	modules,
	connection,
	jumpstart,
	settings,
	siteData,
	jetpackNotices,
	pluginsData,
	search,
	devCard
} );

export default combineReducers( {
	jetpack: jetpackReducer,
	routing: routerReducer,
	globalNotices: globalNotices
} );

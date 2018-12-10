/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import { globalNotices } from 'components/global-notices/state/notices/reducer';

/**
 * Internal dependencies
 */
import { initialState } from 'state/initial-state/reducer';
import { dashboard } from 'state/at-a-glance/reducer';
import { reducer as modules } from 'state/modules/reducer';
import { reducer as connection } from 'state/connection/reducer';
import { reducer as trackingSettings } from 'state/tracking/reducer';
import { reducer as jumpstart } from 'state/jumpstart/reducer';
import { reducer as settings } from 'state/settings/reducer';
import { reducer as siteData } from 'state/site/reducer';
import { reducer as rewind } from 'state/rewind/reducer';
import { reducer as pluginsData } from 'state/site/plugins/reducer';
import { reducer as jetpackNotices } from 'state/jetpack-notices/reducer';
import { reducer as search } from 'state/search/reducer';
import { reducer as devCard } from 'state/dev-version/reducer';
import { reducer as publicize } from 'state/publicize/reducer';
import { reducer as siteVerify } from 'state/site-verify/reducer';

const jetpackReducer = combineReducers( {
	initialState,
	dashboard,
	modules,
	connection,
	trackingSettings,
	jumpstart,
	settings,
	siteData,
	rewind,
	jetpackNotices,
	pluginsData,
	search,
	devCard,
	publicize,
	siteVerify
} );

export default combineReducers( {
	jetpack: jetpackReducer,
	routing: routerReducer,
	globalNotices: globalNotices
} );

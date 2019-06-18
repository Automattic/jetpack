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
import { default as checklist } from 'state/checklist/reducer';
import { reducer as connection } from 'state/connection/reducer';
import { reducer as devCard } from 'state/dev-version/reducer';
import { reducer as jetpackNotices } from 'state/jetpack-notices/reducer';
import { reducer as jumpstart } from 'state/jumpstart/reducer';
import { reducer as modules } from 'state/modules/reducer';
import { reducer as pluginsData } from 'state/site/plugins/reducer';
import { reducer as publicize } from 'state/publicize/reducer';
import { reducer as rewind } from 'state/rewind/reducer';
import { reducer as search } from 'state/search/reducer';
import { reducer as settings } from 'state/settings/reducer';
import { reducer as siteData } from 'state/site/reducer';
import { reducer as siteVerify } from 'state/site-verify/reducer';
import { reducer as trackingSettings } from 'state/tracking/reducer';
import { reducer as mobile } from 'state/mobile/reducer';

const jetpackReducer = combineReducers( {
	checklist,
	connection,
	dashboard,
	devCard,
	initialState,
	jetpackNotices,
	jumpstart,
	modules,
	pluginsData,
	publicize,
	rewind,
	search,
	settings,
	siteData,
	siteVerify,
	trackingSettings,
	mobile,
} );

export default combineReducers( {
	globalNotices: globalNotices,
	jetpack: jetpackReducer,
	routing: routerReducer,
} );

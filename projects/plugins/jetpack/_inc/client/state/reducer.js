/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import { globalNotices } from 'components/global-notices/state/notices/reducer';

/**
 * Internal dependencies
 */
import { initialState } from 'state/initial-state/reducer';
import { dashboard } from 'state/at-a-glance/reducer';
import { reducer as connection } from 'state/connection/reducer';
import { reducer as devCard } from 'state/dev-version/reducer';
import { reducer as plans } from 'state/plans/reducer';
import { reducer as jetpackNotices } from 'state/jetpack-notices/reducer';
import { reducer as modules } from 'state/modules/reducer';
import { reducer as pluginsData } from 'state/site/plugins/reducer';
import { reducer as products } from 'state/products/reducer';
import { reducer as publicize } from 'state/publicize/reducer';
import { reducer as recommendations } from 'state/recommendations';
import { reducer as rewind } from 'state/rewind/reducer';
import { reducer as scan } from 'state/scan/reducer';
import { reducer as search } from 'state/search/reducer';
import { reducer as settings } from 'state/settings/reducer';
import { reducer as siteData } from 'state/site/reducer';
import { reducer as siteProducts } from 'state/site-products/reducer';
import { reducer as siteVerify } from 'state/site-verify/reducer';
import { reducer as disconnectSurvey } from 'state/disconnect-survey/reducer';
import { reducer as trackingSettings } from 'state/tracking/reducer';
import { reducer as mobile } from 'state/mobile/reducer';
import { reducer as licensing } from 'state/licensing/reducer';

const jetpackReducer = combineReducers( {
	connection,
	dashboard,
	devCard,
	initialState,
	jetpackNotices,
	modules,
	plans,
	pluginsData,
	products,
	publicize,
	recommendations,
	rewind,
	scan,
	search,
	settings,
	siteData,
	siteProducts,
	siteVerify,
	disconnectSurvey,
	trackingSettings,
	mobile,
	licensing,
} );

export default combineReducers( {
	globalNotices: globalNotices,
	jetpack: jetpackReducer,
} );

import { combineReducers } from '@wordpress/data';
import notices from 'components/global-notices/store/reducer';
import features from './feature';
import jetpackSettings from './jetpack-settings';
import searchPricing from './search-pricing';
import siteData from './site-data';
import sitePlan from './site-plan';
import siteStats from './site-stats';
import userData from './user-data';

const reducer = combineReducers( {
	siteData,
	jetpackSettings,
	sitePlan,
	siteStats,
	userData,
	features,
	notices,
	searchPricing,
} );

export default reducer;

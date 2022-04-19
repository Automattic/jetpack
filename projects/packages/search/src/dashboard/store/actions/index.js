/**
 * Internal dependencies
 */
import siteSettingActions from './jetpack-settings';
import sitePlanActions from './site-plan';
import siteStatsActions from './site-stats';
import noticeActions from 'components/global-notices/store/actions';
import searchPricingActions from './search-pricing';

const actions = {
	...siteSettingActions,
	...sitePlanActions,
	...siteStatsActions,
	...noticeActions,
	...searchPricingActions,
};

export default actions;

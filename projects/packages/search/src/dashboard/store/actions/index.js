import noticeActions from 'components/global-notices/store/actions';
import siteSettingActions from './jetpack-settings';
import searchPricingActions from './search-pricing';
import sitePlanActions from './site-plan';
import siteStatsActions from './site-stats';

const actions = {
	...siteSettingActions,
	...sitePlanActions,
	...siteStatsActions,
	...noticeActions,
	...searchPricingActions,
};

export default actions;

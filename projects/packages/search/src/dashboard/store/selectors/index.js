/**
 * Internal dependencies
 */
import siteDataSelectors from './site-data';
import jetpackSettingSelectors from './jetpack-settings';
import sitePlanSelectors from './site-plan';
import userDataSelectors from './user-data';
import noticeSelectors from 'components/global-notices/store/selectors';
import featureSelectors from './feature';
import siteStatsSelectors from './site-stats';
import searchPricingSelectors from './search-pricing';

const selectors = {
	...siteDataSelectors,
	...jetpackSettingSelectors,
	...sitePlanSelectors,
	...userDataSelectors,
	...noticeSelectors,
	...featureSelectors,
	...siteStatsSelectors,
	...searchPricingSelectors,
};

export default selectors;

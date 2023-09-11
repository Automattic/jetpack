import noticeSelectors from 'components/global-notices/store/selectors';
import featureSelectors from './feature';
import jetpackSettingSelectors from './jetpack-settings';
import searchPricingSelectors from './search-pricing';
import siteDataSelectors from './site-data';
import sitePlanSelectors from './site-plan';
import siteStatsSelectors from './site-stats';
import userDataSelectors from './user-data';

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

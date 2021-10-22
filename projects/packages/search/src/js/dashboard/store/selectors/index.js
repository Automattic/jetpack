/**
 * Internal dependencies
 */
import siteDataSelectors from './site-data';
import jetpackSettingSelectors from './jetpack-settings';
import sitePlanSelectors from './site-plan';

const selectors = {
	...siteDataSelectors,
	...jetpackSettingSelectors,
	...sitePlanSelectors,
};

export default selectors;

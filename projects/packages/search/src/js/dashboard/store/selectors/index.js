/**
 * Internal dependencies
 */
import siteDataSelectors from './site-data';
import jetpackSettingSelectors from './jetpack-settings';
import sitePlanSelectors from './site-plan';
import userDataSelectors from './user-data';

const selectors = {
	...siteDataSelectors,
	...jetpackSettingSelectors,
	...sitePlanSelectors,
	...userDataSelectors,
};

export default selectors;

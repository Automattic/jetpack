/**
 * Internal dependencies
 */
import siteDataSelectors from './site-data';
import connectionsSelectors from './connections';
import jetpackSettingSelectors from './jetpack-settings';

const selectors = {
	...siteDataSelectors,
	...connectionsSelectors,
	...jetpackSettingSelectors,
};

export default selectors;

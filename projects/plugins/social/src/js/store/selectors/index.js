/**
 * Internal dependencies
 */
import siteDataSelectors from './site-data';
import connectionDataSelectors from './connection-data';
import jetpackSettingSelectors from './jetpack-settings';

const selectors = {
	...siteDataSelectors,
	...connectionDataSelectors,
	...jetpackSettingSelectors,
};

export default selectors;

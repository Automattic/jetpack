import connectionDataSelectors from './connection-data';
import jetpackSettingSelectors from './jetpack-settings';
import siteDataSelectors from './site-data';

const selectors = {
	...siteDataSelectors,
	...connectionDataSelectors,
	...jetpackSettingSelectors,
};

export default selectors;

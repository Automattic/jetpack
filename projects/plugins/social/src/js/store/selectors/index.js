import connectionDataSelectors from './connection-data';
import jetpackSettingSelectors from './jetpack-settings';
import sharesDataSelectors from './shares-data';
import siteDataSelectors from './site-data';

const selectors = {
	...siteDataSelectors,
	...connectionDataSelectors,
	...jetpackSettingSelectors,
	...sharesDataSelectors,
};

export default selectors;

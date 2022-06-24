import connectionDataSelectors from './connection-data';
import jetpackSettingSelectors from './jetpack-settings';
import sharesCountSelectors from './shares-count';
import siteDataSelectors from './site-data';

const selectors = {
	...siteDataSelectors,
	...connectionDataSelectors,
	...jetpackSettingSelectors,
	...sharesCountSelectors,
};

export default selectors;

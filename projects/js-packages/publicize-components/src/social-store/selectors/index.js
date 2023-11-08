import connectionDataSelectors from './connection-data';
import jetpackSettingSelectors from './jetpack-settings';
import jetpackSocialSettingsSelectors from './jetpack-social-settings';
import sharesDataSelectors from './shares-data';
import siteDataSelectors from './site-data';

const selectors = {
	...siteDataSelectors,
	...connectionDataSelectors,
	...jetpackSettingSelectors,
	...sharesDataSelectors,
	...jetpackSocialSettingsSelectors,
};

export default selectors;

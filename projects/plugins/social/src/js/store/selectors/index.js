import connectionDataSelectors from './connection-data';
import jetpackSettingSelectors from './jetpack-settings';
import sharesDataSelectors from './shares-data';
import siteDataSelectors from './site-data';
import socialImageGeneratorSettingsSelectors from './social-image-generator-settings';

const selectors = {
	...siteDataSelectors,
	...connectionDataSelectors,
	...jetpackSettingSelectors,
	...sharesDataSelectors,
	...socialImageGeneratorSettingsSelectors,
};

export default selectors;

import * as connectionDataSelectors from './connection-data';
import jetpackSettingSelectors from './jetpack-settings';
import * as shareStatusSelectors from './share-status';
import siteDataSelectors from './site-data';
import socialImageGeneratorSettingsSelectors from './social-image-generator-settings';

const selectors = {
	...siteDataSelectors,
	...connectionDataSelectors,
	...jetpackSettingSelectors,
	...socialImageGeneratorSettingsSelectors,
	...shareStatusSelectors,
};

export default selectors;

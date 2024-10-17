import * as connectionDataSelectors from './connection-data';
import jetpackSettingSelectors from './jetpack-settings';
import * as shareStatusSelectors from './share-status';
import shareTitleOnlySelectors from './share-title-only';
import siteDataSelectors from './site-data';
import socialImageGeneratorSettingsSelectors from './social-image-generator-settings';

const selectors = {
	...siteDataSelectors,
	...connectionDataSelectors,
	...jetpackSettingSelectors,
	...socialImageGeneratorSettingsSelectors,
	...shareStatusSelectors,
	...shareTitleOnlySelectors,
	userConnectionUrl: state => state.userConnectionUrl,
	hasPaidFeatures: state => state.hasPaidFeatures,
};

export default selectors;

import autoConversionSettingActions from './auto-conversion-settings';
import * as connectionData from './connection-data';
import siteSettingActions from './jetpack-settings';
import jetpackSocialSettings from './jetpack-social-settings';
import socialImageGeneratorSettingActions from './social-image-generator-settings';

const actions = {
	...siteSettingActions,
	...socialImageGeneratorSettingActions,
	...autoConversionSettingActions,
	...jetpackSocialSettings,
	...connectionData,
};

export default actions;

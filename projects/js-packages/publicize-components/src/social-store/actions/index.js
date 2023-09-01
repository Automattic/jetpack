import autoConversionSettingActions from './auto-conversion-settings';
import siteSettingActions from './jetpack-settings';
import socialImageGeneratorSettingActions from './social-image-generator-settings';

const actions = {
	...siteSettingActions,
	...socialImageGeneratorSettingActions,
	...autoConversionSettingActions,
};

export default actions;

import siteSettingActions from './jetpack-settings';
import socialImageGeneratorSettingActions from './social-image-generator-settings';

const actions = {
	...siteSettingActions,
	...socialImageGeneratorSettingActions,
};

export default actions;

import autoConversionSettingActions from './auto-conversion-settings';
import * as connectionData from './connection-data';
import siteSettingActions from './jetpack-settings';
import socialImageGeneratorSettingActions from './social-image-generator-settings';

const actions = {
	...siteSettingActions,
	...socialImageGeneratorSettingActions,
	...autoConversionSettingActions,
	...connectionData,
};

export default actions;

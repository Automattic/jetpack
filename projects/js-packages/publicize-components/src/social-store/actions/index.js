import * as connectionData from './connection-data';
import siteSettingActions from './jetpack-settings';
import jetpackSocialSettings from './jetpack-social-settings';
import socialImageGeneratorSettingActions from './social-image-generator-settings';
import socialNotesSettings from './social-notes-settings';

const actions = {
	...siteSettingActions,
	...socialImageGeneratorSettingActions,
	...jetpackSocialSettings,
	...connectionData,
	...socialNotesSettings,
};

export default actions;

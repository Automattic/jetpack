import * as connectionData from './connection-data';
import siteSettingActions from './jetpack-settings';
import jetpackSocialSettings from './jetpack-social-settings';
import * as shareStatus from './share-status';
import socialImageGeneratorSettingActions from './social-image-generator-settings';
import socialNotesSettings from './social-notes-settings';

const actions = {
	...shareStatus,
	...siteSettingActions,
	...socialImageGeneratorSettingActions,
	...jetpackSocialSettings,
	...connectionData,
	...socialNotesSettings,
};

export default actions;

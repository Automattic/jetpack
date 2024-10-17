import * as connectionData from './connection-data';
import siteSettingActions from './jetpack-settings';
import jetpackSocialSettings from './jetpack-social-settings';
import * as shareStatus from './share-status';
import shareTitleOnly from './share-title-only';
import socialImageGeneratorSettingActions from './social-image-generator-settings';
import socialNotesSettings from './social-notes-settings';

const actions = {
	...shareStatus,
	...siteSettingActions,
	...socialImageGeneratorSettingActions,
	...jetpackSocialSettings,
	...connectionData,
	...socialNotesSettings,
	...shareTitleOnly,
};

export default actions;

import * as connectionData from './connection-data';
import siteSettingActions from './jetpack-settings';
import jetpackSocialSettings from './jetpack-social-settings';
import * as shareStatus from './share-status';
import socialNotesSettings from './social-notes-settings';

const actions = {
	...shareStatus,
	...siteSettingActions,
	...jetpackSocialSettings,
	...connectionData,
	...socialNotesSettings,
};

export default actions;

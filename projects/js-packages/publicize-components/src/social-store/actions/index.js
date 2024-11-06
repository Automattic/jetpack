import * as connectionData from './connection-data';
import siteSettingActions from './jetpack-settings';
import * as shareStatus from './share-status';
import * as sigActions from './social-image-generator';
import socialNotesSettings from './social-notes-settings';

const actions = {
	...shareStatus,
	...siteSettingActions,
	...connectionData,
	...socialNotesSettings,
	...sigActions,
};

export default actions;

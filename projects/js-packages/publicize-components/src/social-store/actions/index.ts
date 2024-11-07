import * as connectionData from './connection-data';
import * as shareStatus from './share-status';
import * as sigActions from './social-image-generator';
import * as socialPluginSettings from './social-plugin-settings';

const actions = {
	...shareStatus,
	...connectionData,
	...sigActions,
	...socialPluginSettings,
};

export default actions;

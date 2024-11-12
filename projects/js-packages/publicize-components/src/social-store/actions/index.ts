import * as connectionData from './connection-data';
import * as shareStatus from './share-status';
import * as sigActions from './social-image-generator';
import * as socialPluginSettings from './social-plugin-settings';
import * as utmActions from './utm-settings';

const actions = {
	...shareStatus,
	...connectionData,
	...sigActions,
	...utmActions,
	...socialPluginSettings,
};

export default actions;

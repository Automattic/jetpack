import * as connectionData from './connection-data';
import * as renderedMessagesActions from './rendered-messages';
import * as scheduledSharesActions from './scheduled-shares';
import * as servicesActions from './services';
import * as sharePost from './share-post';
import * as shareStatus from './share-status';
import * as sigActions from './social-image-generator';
import * as socialModuleSettings from './social-module-settings';
import * as socialNoteSettings from './social-notes';
import * as socialSettings from './social-settings';
import * as trafficStatsActions from './traffic-stats';
import * as unifiedModal from './unified-modal';
import * as utmActions from './utm-settings';

const actions = {
	...shareStatus,
	...sharePost,
	...connectionData,
	...sigActions,
	...utmActions,
	...socialNoteSettings,
	...socialSettings,
	...socialModuleSettings,
	...servicesActions,
	...scheduledSharesActions,
	...trafficStatsActions,
	...unifiedModal,
	...renderedMessagesActions,
};

export default actions;

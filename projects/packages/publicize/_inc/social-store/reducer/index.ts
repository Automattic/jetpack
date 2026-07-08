import { combineReducers } from '@wordpress/data';
import connectionData from './connection-data';
import { renderedMessages } from './rendered-messages';
import { scheduledShares } from './scheduled-shares';
import { sharePost } from './share-post';
import { shareStatus } from './share-status';
import { trafficStats } from './traffic-stats';
import { unifiedModal } from './unified-modal';

const reducer = combineReducers( {
	connectionData,
	shareStatus,
	sharePost,
	scheduledShares,
	trafficStats,
	unifiedModal,
	renderedMessages,
} );

export default reducer;

import { combineReducers } from '@wordpress/data';
import connectionData from './connection-data';
import { scheduledShares } from './scheduled-shares';
import { sharePost } from './share-post';
import { shareStatus } from './share-status';
import { unifiedModal } from './unified-modal';

const reducer = combineReducers( {
	connectionData,
	shareStatus,
	sharePost,
	scheduledShares,
	unifiedModal,
} );

export default reducer;

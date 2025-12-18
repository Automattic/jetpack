import { combineReducers } from '@wordpress/data';
import connectionData from './connection-data';
import { renderCount } from './render-count';
import { sharePost } from './share-post';
import { shareStatus } from './share-status';
import { unifiedModal } from './unified-modal';

const reducer = combineReducers( {
	connectionData,
	renderCount,
	shareStatus,
	sharePost,
	unifiedModal,
} );

export default reducer;

import { combineReducers } from '@wordpress/data';
import connectionData from './connection-data';
import { keyringData } from './keyring-data';
import { sharePost } from './share-post';
import { shareStatus } from './share-status';

const reducer = combineReducers( {
	connectionData,
	keyringData,
	shareStatus,
	sharePost,
} );

export default reducer;

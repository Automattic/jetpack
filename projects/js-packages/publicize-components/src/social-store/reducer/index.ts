import { combineReducers } from '@wordpress/data';
import connectionData from './connection-data';
import { shareStatus } from './share-status';

const reducer = combineReducers( {
	connectionData,
	shareStatus,
} );

export default reducer;

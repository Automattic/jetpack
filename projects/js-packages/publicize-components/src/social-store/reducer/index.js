import { combineReducers } from '@wordpress/data';
import connectionData from './connection-data';
import { shareStatus } from './share-status';
import siteData from './site-data';

const reducer = combineReducers( {
	siteData,
	connectionData,
	shareStatus,
} );

export default reducer;

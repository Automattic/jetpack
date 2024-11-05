import { combineReducers } from '@wordpress/data';
import connectionData from './connection-data';
import jetpackSettings from './jetpack-settings';
import { shareStatus } from './share-status';
import siteData from './site-data';

const reducer = combineReducers( {
	siteData,
	connectionData,
	jetpackSettings,
	shareStatus,
} );

export default reducer;

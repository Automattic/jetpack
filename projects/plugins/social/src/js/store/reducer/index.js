import { combineReducers } from '@wordpress/data';
import connectionData from './connection-data';
import jetpackSettings from './jetpack-settings';
import sharesCount from './shares-count';
import siteData from './site-data';

const reducer = combineReducers( {
	siteData,
	connectionData,
	jetpackSettings,
	sharesCount,
} );

export default reducer;

import { combineReducers } from '@wordpress/data';
import connectionData from './connection-data';
import jetpackSettings from './jetpack-settings';
import sharesData from './shares-data';
import siteData from './site-data';

const reducer = combineReducers( {
	sharesData,
	siteData,
	connectionData,
	jetpackSettings,
} );

export default reducer;

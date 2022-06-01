import { combineReducers } from '@wordpress/data';
import connectionData from './connection-data';
import jetpackSettings from './jetpack-settings';
import siteData from './site-data';

const reducer = combineReducers( {
	siteData,
	connectionData,
	jetpackSettings,
} );

export default reducer;

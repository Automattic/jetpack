import { combineReducers } from '@wordpress/data';
import connectionData from './connection-data';
import jetpackSettings from './jetpack-settings';
import jetpackSocialSettings from './jetpack-social-settings';
import sharesData from './shares-data';
import siteData from './site-data';

const reducer = combineReducers( {
	sharesData,
	siteData,
	connectionData,
	jetpackSettings,
	jetpackSocialSettings,
} );

export default reducer;

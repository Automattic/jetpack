import { combineReducers } from '@wordpress/data';
import autoConversionSettings from './auto-conversion-settings';
import connectionData from './connection-data';
import jetpackSettings from './jetpack-settings';
import sharesData from './shares-data';
import siteData from './site-data';
import socialImageGeneratorSettings from './social-image-generator-settings';
import socialNotesSettings from './social-notes-settings';

const reducer = combineReducers( {
	sharesData,
	siteData,
	connectionData,
	jetpackSettings,
	socialImageGeneratorSettings,
	autoConversionSettings,
	socialNotesSettings,
	hasPaidPlan: ( state = false ) => state,
} );

export default reducer;

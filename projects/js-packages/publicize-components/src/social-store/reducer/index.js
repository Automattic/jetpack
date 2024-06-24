import { combineReducers } from '@wordpress/data';
import autoConversionSettings from './auto-conversion-settings';
import connectionData from './connection-data';
import jetpackSettings from './jetpack-settings';
import sharesData from './shares-data';
import siteData from './site-data';
import socialImageGeneratorSettings from './social-image-generator-settings';

const reducer = combineReducers( {
	sharesData,
	siteData,
	connectionData,
	jetpackSettings,
	socialImageGeneratorSettings,
	autoConversionSettings,
	hasPaidPlan: ( state = false ) => state,
	userConnectionUrl: ( state = '' ) => state,
	useAdminUiV1: ( state = false ) => state,
	hasPaidFeatures: ( state = false ) => state,
	connectionRefreshPath: ( state = '' ) => state,
} );

export default reducer;

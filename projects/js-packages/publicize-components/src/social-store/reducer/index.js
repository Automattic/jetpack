import { combineReducers } from '@wordpress/data';
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
	hasPaidPlan: ( state = false ) => state,
	useAdminUiV1: ( state = false ) => state,
	featureFlags: ( state = false ) => state,
	hasPaidFeatures: ( state = false ) => state,
	connectionRefreshPath: ( state = '' ) => state,
} );

export default reducer;

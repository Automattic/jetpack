import { combineReducers } from '@wordpress/data';
import connectionData from './connection-data';
import jetpackSettings from './jetpack-settings';
import { shareStatus } from './share-status';
import siteData from './site-data';
import socialImageGeneratorSettings from './social-image-generator-settings';

const reducer = combineReducers( {
	siteData,
	connectionData,
	jetpackSettings,
	socialImageGeneratorSettings,
	shareStatus,
	hasPaidPlan: ( state = false ) => state,
	hasPaidFeatures: ( state = false ) => state,
} );

export default reducer;

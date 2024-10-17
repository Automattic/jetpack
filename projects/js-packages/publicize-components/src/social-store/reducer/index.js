import { combineReducers } from '@wordpress/data';
import connectionData from './connection-data';
import jetpackSettings from './jetpack-settings';
import { shareStatus } from './share-status';
import shareTitleOnly from './share-title-only';
import siteData from './site-data';
import socialImageGeneratorSettings from './social-image-generator-settings';

const reducer = combineReducers( {
	siteData,
	connectionData,
	jetpackSettings,
	socialImageGeneratorSettings,
	shareStatus,
	shareTitleOnly,
	hasPaidPlan: ( state = false ) => state,
	userConnectionUrl: ( state = '' ) => state,
	hasPaidFeatures: ( state = false ) => state,
} );

export default reducer;

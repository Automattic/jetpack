/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import siteData from './site-data';
import userData from './user-data';
import jetpackSettings from './jetpack-settings';
import sitePlan from './site-plan';
import features from './feature';
import notices from 'components/global-notices/store/reducer';

const reducer = combineReducers( {
	siteData,
	jetpackSettings,
	sitePlan,
	userData,
	features,
	notices,
} );

export default reducer;

/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import siteData from './site-data';
import jetpackSettings from './jetpack-settings';
import sitePlan from './site-plan';

const reducer = combineReducers( {
	siteData,
	jetpackSettings,
	sitePlan,
} );

export default reducer;

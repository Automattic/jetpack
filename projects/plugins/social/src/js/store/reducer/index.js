/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import siteData from './site-data';
import jetpackSettings from './jetpack-settings';

const reducer = combineReducers( {
	siteData,
	jetpackSettings,
} );

export default reducer;

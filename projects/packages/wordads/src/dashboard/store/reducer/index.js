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
import features from './feature';
import notices from 'components/global-notices/store/reducer';

const reducer = combineReducers( {
	siteData,
	jetpackSettings,
	userData,
	features,
	notices,
} );

export default reducer;

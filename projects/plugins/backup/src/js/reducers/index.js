/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import API from './api';
import jetpackStatus from './jetpack-status';
import assets from './assets';
import connectedPlugins from './connected-plugins';
import siteData from './site-data';

const reducer = combineReducers( {
	connectedPlugins,
	API,
	jetpackStatus,
	assets,
	siteData,
} );

export default reducer;

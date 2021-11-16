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

const reducer = combineReducers( {
	API,
	jetpackStatus,
	assets,
} );

export default reducer;

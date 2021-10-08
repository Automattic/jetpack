/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import connectionStatus from './connection-status';
import API from './api';
import jetpackStatus from './jetpack-status';
import assets from './assets';

const reducer = combineReducers( {
	connectionStatus,
	API,
	jetpackStatus,
	assets,
} );

export default reducer;

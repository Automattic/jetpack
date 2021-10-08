/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import connectionStatus from './connection-status';
import API from './api';
import assets from './assets';

const reducer = combineReducers( {
	connectionStatus,
	API,
	assets,
} );

export default reducer;

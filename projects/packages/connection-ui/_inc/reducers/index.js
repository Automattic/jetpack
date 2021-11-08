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
import IDC from './idc';

const reducer = combineReducers( {
	connectionStatus,
	API,
	assets,
	IDC,
} );

export default reducer;

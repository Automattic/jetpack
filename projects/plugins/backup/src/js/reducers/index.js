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

const reducer = combineReducers( {
	connectionStatus,
	API,
	jetpackStatus,
} );

export default reducer;

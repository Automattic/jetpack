/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import connectionStatus from './connection-status';
import API from './api';

const reducer = combineReducers( {
	connectionStatus,
	API,
} );

export default reducer;

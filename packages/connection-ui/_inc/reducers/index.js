/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import connectionStatus from './connection-status';

const reducer = combineReducers( {
	connectionStatus,
} );

export default reducer;

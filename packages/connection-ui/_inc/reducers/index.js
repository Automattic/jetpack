/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import connectionStatus from './connection-status';
import plugins from './plugins';

const reducer = combineReducers( {
	connectionStatus,
	plugins,
} );

export default reducer;

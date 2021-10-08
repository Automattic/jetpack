/**
 * External dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	connectionStatus,
	connectionStatusIsFetching,
} from '../components/with-connection-status/state/reducers';

const reducers = combineReducers( {
	connectionStatus,
	connectionStatusIsFetching,
} );

export default reducers;

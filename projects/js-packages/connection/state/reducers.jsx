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
import {
	connectedPlugins,
	connectedPluginsIsFetching,
} from '../components/with-connected-plugins/state/reducers';

const reducers = combineReducers( {
	connectionStatus,
	connectionStatusIsFetching,
	connectedPlugins,
	connectedPluginsIsFetching,
} );

export default reducers;

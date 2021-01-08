/**
 * Internal dependencies
 */
import {
	PLUGIN_CONNECTED,
	PLUGIN_DISCONNECTED,
	PLUGIN_REQUEST_IN_PROGRESS,
	PLUGIN_REQUEST_DONE,
} from '../actions/plugins';

const plugins = ( state = {}, action ) => {
	switch ( action.type ) {
		case PLUGIN_CONNECTED:
			if ( action.data && action.data.slug ) {
				return {
					...state,
					all: ( state.all || [] ).map( plugin => {
						plugin.slug === action.data.slug && ( plugin.isConnected = true );
						return plugin;
					} ),
				};
			}
			break;
		case PLUGIN_DISCONNECTED:
			if ( action.data && action.data.slug ) {
				return {
					...state,
					all: ( state.all || [] ).map( plugin => {
						plugin.slug === action.data.slug && ( plugin.isConnected = false );
						return plugin;
					} ),
				};
			}
			break;
		case PLUGIN_REQUEST_IN_PROGRESS:
			return {
				...state,
				isRequestInProgress: true,
			};
		case PLUGIN_REQUEST_DONE:
			return {
				...state,
				isRequestInProgress: false,
			};
	}

	return state;
};

export default plugins;

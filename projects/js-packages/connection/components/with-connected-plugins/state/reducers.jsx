/**
 * Internal dependencies
 */
import { SET_CONNECTED_PLUGINS, SET_CONNECTED_PLUGINS_IS_FETCHING } from './actions';

const connectedPlugins = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_CONNECTED_PLUGINS:
			return { ...state, ...action.connectedPlugins };
	}

	return state;
};

const connectedPluginsIsFetching = ( state = false, action ) => {
	switch ( action.type ) {
		case SET_CONNECTED_PLUGINS_IS_FETCHING:
			return action.isFetching;
	}

	return state;
};

export { connectedPlugins, connectedPluginsIsFetching };

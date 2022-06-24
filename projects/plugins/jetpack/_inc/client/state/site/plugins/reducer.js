import { assign } from 'lodash';
import { combineReducers } from 'redux';
import {
	JETPACK_PLUGINS_DATA_FETCH,
	JETPACK_PLUGINS_DATA_FETCH_RECEIVE,
	JETPACK_PLUGINS_DATA_FETCH_FAIL,
} from 'state/action-types';

const items = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_PLUGINS_DATA_FETCH_RECEIVE:
			return assign( {}, action.pluginsData );
		default:
			return state;
	}
};

const initialRequestsState = {
	isFetchingPluginsData: false,
};

const requests = ( state = initialRequestsState, action ) => {
	switch ( action.type ) {
		case JETPACK_PLUGINS_DATA_FETCH:
			return assign( {}, state, {
				isFetchingPluginsData: true,
			} );
		case JETPACK_PLUGINS_DATA_FETCH_FAIL:
		case JETPACK_PLUGINS_DATA_FETCH_RECEIVE:
			return assign( {}, state, {
				isFetchingPluginsData: false,
			} );

		default:
			return state;
	}
};

export const reducer = combineReducers( {
	items,
	requests,
} );

/**
 * Returns true if currently requesting plugin data. Otherwise false.
 * otherwise.
 *
 * @param {object} state - Global state tree
 * @returns {boolean} - Whether plugin data is being requested
 */
export function isFetchingPluginsData( state ) {
	return !! state.jetpack.pluginsData.requests.isFetchingPluginsData;
}

/**
 * Returns the site plugins data
 *
 * @param {object} state - Global state tree
 * @returns {boolean} - The plugins data
 */
export function getPluginsData( state ) {
	return state.jetpack.pluginsData.items;
}

/**
 * Returns whether the plugin is active or not.
 *
 * @param  {object}  state  - Global state tree
 * @param  {string}  plugin - Slug of plugin to check.
 * @returns {boolean} True if plugin is active, false otherwise.
 */
export function isPluginActive( state, plugin ) {
	return (
		state.jetpack.pluginsData.items[ plugin ] && state.jetpack.pluginsData.items[ plugin ].active
	);
}

/**
 * Returns whether the plugin is installed or not.
 *
 * @param  {object}  state  - Global state tree
 * @param  {string}  plugin - Slug of plugin to check.
 * @returns {boolean} True if plugin is installed, false otherwise.
 */
export function isPluginInstalled( state, plugin ) {
	return !! state.jetpack.pluginsData.items[ plugin ];
}

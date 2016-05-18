/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import get from 'lodash/get';
import assign from 'lodash/assign';

/**
 * Internal dependencies
 */
import {
	JETPACK_SET_INITIAL_STATE,
	JETPACK_MODULES_LIST_FETCH,
	JETPACK_MODULES_LIST_FETCH_FAIL,
	JETPACK_MODULES_LIST_RECEIVE,
	JETPACK_MODULE_ACTIVATE,
	JETPACK_MODULE_ACTIVATE_FAIL,
	JETPACK_MODULE_ACTIVATE_SUCCESS,
	JETPACK_MODULE_DEACTIVATE,
	JETPACK_MODULE_DEACTIVATE_FAIL,
	JETPACK_MODULE_DEACTIVATE_SUCCESS,
	JETPACK_MODULE_UPDATE_OPTION,
	JETPACK_MODULE_UPDATE_OPTION_FAIL,
	JETPACK_MODULE_UPDATE_OPTION_SUCCESS

} from 'state/action-types';

const items = ( state = window.Initial_State.getModules, action ) => {
	switch ( action.type ) {
		case JETPACK_SET_INITIAL_STATE:
		case JETPACK_MODULES_LIST_RECEIVE:
			return assign( {}, state, action.modules );
		case JETPACK_MODULE_ACTIVATE_SUCCESS:
			return assign( {}, state, {
				[ action.module ]: assign( {}, state[ action.module ], { activated: true } )
			} );
		case JETPACK_MODULE_DEACTIVATE_SUCCESS:
			return assign( {}, state, {
				[ action.module ]: assign( {}, state[ action.module ], { activated: false } )
			} );
		case JETPACK_MODULE_UPDATE_OPTION_SUCCESS:
			return assign( {}, state, {
				[ action.module ]: assign( {}, state[ action.module ], {
					[ action.option_name ]: action.option_value
				} )
			} );
		default:
			return state;
	}
};

const initialRequestsState = {
	fetchingModulesList: false,
	activating: {},
	deactivating: {},
	updatingOption: {}
};

const requests = ( state = initialRequestsState, action ) => {
	switch ( action.type ) {
		case JETPACK_MODULES_LIST_FETCH:
			return assign( {}, state, { fetchingModulesList: true} );
		case JETPACK_MODULES_LIST_FETCH_FAIL:
		case JETPACK_MODULES_LIST_RECEIVE:
			return assign( {}, state, { fetchingModulesList: false} );
		case JETPACK_MODULE_ACTIVATE:
			return assign( {}, state, {
				activating: assign( {}, state.activating, {
					[ action.module ]: true
				}
			) } );
		case JETPACK_MODULE_ACTIVATE_FAIL:
		case JETPACK_MODULE_ACTIVATE_SUCCESS:
			return assign( {}, state, {
				activating: assign( {}, state.activating, {
					[ action.module ]: false
				}
			) } );
		case JETPACK_MODULE_DEACTIVATE:
			return assign( {}, state, {
				deactivating: assign( {}, state.deactivating, {
					[ action.module ]: true
				}
			) } );
		case JETPACK_MODULE_DEACTIVATE_FAIL:
		case JETPACK_MODULE_DEACTIVATE_SUCCESS:
			return assign( {}, state, {
				deactivating: assign( {}, state.deactivating, {
					[ action.module ]: false
				}
			) } );
		case JETPACK_MODULE_UPDATE_OPTION:
			return assign( {}, state, {
				updatingOption: assign( {}, state.updatingOption, {
					[ action.module ]: true
				}
			) } );
		case JETPACK_MODULE_UPDATE_OPTION_FAIL:
		case JETPACK_MODULE_UPDATE_OPTION_SUCCESS:
			return assign( {}, state, {
				updatingOption: assign( {}, state.updatingOption, {
					[ action.module ]: false
				}
			) } );
		default:
			return state;
	}
};

export const reducer = combineReducers( {
	items,
	requests
} );

/**
 * Returns true if currently requesting modules lists or false
 * otherwise.
 *
 * @param  {Object}  state  Global state tree
 * @return {Boolean}         Whether modules are being requested
 */
export function isFetchingModulesList( state ) {
	return state.jetpack.modules.requests.fetchingModulesList ? true : false;
}

/**
 * Returns true if we are currently making a request to activate a module
 *
 * @param  {Object}  state  Global state tree
 * @param  {String}  name module name
 * @return {Boolean}         Whether module is being activated
 */
export function isActivatingModule( state, name ) {
	return state.jetpack.modules.requests.activating[ name ] ? true : false;
}

/**
 * Returns true if we are currently making a request to deactivate a module
 *
 * @param  {Object}  state  Global state tree
 * @param  {String}  name module name
 * @return {Boolean}         Whether module is being deactivated
 */
export function isDeactivatingModule( state, name ) {
	return state.jetpack.modules.requests.deactivating[ name ] ? true : false;
}

/**
 * Returns true if we are currently making a request to update a module's option
 *
 * @param  {Object}  state  Global state tree
 * @param  {String}  name module name to check
 * @return {Boolean}         Whether option is being updated on the module
 */
export function isUpdatingModuleOption( state, name ) {
	return state.jetpack.modules.requests.updatingOption[ name ] ? true : false;
}

/**
 * Returns an object with jetpack modules descriptions keyed by module name
 * @param  {Object} state Global state tree
 * @return {Object}       Modules keyed by module name
 */
export function getModules( state ) {
	return state.jetpack.modules.items;
}

/**
 * Returns a module object by its name as present in the state
 * @param  {Object} state Global state tree
 * @param  {String}  name module name
 * @return {Object}       Module description
 */
export function getModule( state, name ) {
	return get( state.jetpack.modules.items, name, {} );
}

/**
 * Returns an array of modules that match a given feature
 *
 * Module features are defined in the module's header comments
 *
 * @param  {Object} state   Global state tree
 * @param  {String} feature Feature to select
 * @return {Array}          Array of modules that match the feature.
 */
export function getModulesByFeature( state, feature ) {
	return Object.keys( state.jetpack.modules.items ).filter( ( name ) =>
		state.jetpack.modules[ name ].feature.indexOf( feature ) !== -1
	).map( ( name ) => state.jetpack.modules.items[ name ] );
}

/**
 * Returns true if the module is activated
 * @param  {Object}  state Global state tree
 * @param  {String}  name  A module's name
 * @return {Boolean}       Weather a module is activated
 */
export function isModuleActivated( state, name ) {
	return get( state.jetpack.modules.items, [ name, 'activated' ], false ) ? true : false;
}

/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import get from 'lodash/get';

/**
 * Internal dependencies
 */
import {
	JETPACK_MODULES_LIST_FETCH,
	JETPACK_MODULES_LIST_FETCH_FAIL,
	JETPACK_MODULES_LIST_RECEIVE,
	JETPACK_MODULE_FETCH,
	JETPACK_MODULE_FETCH_FAIL,
	JETPACK_MODULE_RECEIVE,
	JETPACK_MODULE_ACTIVATE,
	JETPACK_MODULE_ACTIVATE_FAIL,
	JETPACK_MODULE_ACTIVATE_SUCCESS,
	JETPACK_MODULE_DEACTIVATE,
	JETPACK_MODULE_DEACTIVATE_FAIL,
	JETPACK_MODULE_DEACTIVATE_SUCCESS

} from 'state/action-types';

const items = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_MODULES_LIST_RECEIVE:
			return Object.assign( {}, action.modules );
		case JETPACK_MODULE_ACTIVATE_SUCCESS:
			return Object.assign( {}, state, {
				[ action.module ]: Object.assign( {}, state[ action.module ], { activated: true } )
			} );
		case JETPACK_MODULE_DEACTIVATE_SUCCESS:
			return Object.assign( {}, state, {
				[ action.module ]: Object.assign( {}, state[ action.module ], { activated: false } )
			} );
		default:
			return state;
	}
};

const requests = ( state = { fetchingModulesList: false, activating: {}, deactivating: {} }, action ) => {
	switch ( action.type ) {
		case JETPACK_MODULES_LIST_FETCH:
			return Object.assign( {}, state, { fetchingModulesList: true} );
		case JETPACK_MODULES_LIST_FETCH_FAIL:
		case JETPACK_MODULES_LIST_RECEIVE:
			return Object.assign( {}, state, { fetchingModulesList: false} );
		case JETPACK_MODULE_ACTIVATE:
			return Object.assign( {}, state, {
				activating: Object.assign( {}, state.activating, {
					[ action.module ]: true
				}
			) } );
		case JETPACK_MODULE_ACTIVATE_FAIL:
		case JETPACK_MODULE_ACTIVATE_SUCCESS:
			return Object.assign( {}, state, {
				activating: Object.assign( {}, state.activating, {
					[ action.module ]: false
				}
			) } );
		case JETPACK_MODULE_DEACTIVATE:
			return Object.assign( {}, state, {
				deactivating: Object.assign( {}, state.deactivating, {
					[ action.module ]: true
				}
			) } );
		case JETPACK_MODULE_DEACTIVATE_FAIL:
		case JETPACK_MODULE_DEACTIVATE_SUCCESS:
			return Object.assign( {}, state, {
				deactivating: Object.assign( {}, state.deactivating, {
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
	return get( state.jetpack.modules.items, name );
}

/**
 * Returns an array of modules that match a given feature
 *
 * Module features are defined in the module's header comments
 *
 * @param  {Object} state   Global state tree
 * @param  {String} feature Feature to select
 * @return {Array}         Array of modules that match the feature.
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

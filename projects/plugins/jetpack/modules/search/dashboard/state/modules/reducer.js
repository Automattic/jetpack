/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import { assign, get, includes, intersection } from 'lodash';

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
	JETPACK_MODULE_UPDATE_OPTIONS,
	JETPACK_MODULE_UPDATE_OPTIONS_FAIL,
	JETPACK_MODULE_UPDATE_OPTIONS_SUCCESS,
} from 'state/action-types';

export const items = ( state = {}, action ) => {
	switch ( action.type ) {
		case JETPACK_SET_INITIAL_STATE:
			return assign( {}, action.initialState.getModules );
		case JETPACK_MODULES_LIST_RECEIVE:
			return assign( {}, state, action.modules );
		case JETPACK_MODULE_ACTIVATE_SUCCESS:
			return assign( {}, state, {
				[ action.module ]: assign( {}, state[ action.module ], { activated: true } ),
			} );
		case JETPACK_MODULE_DEACTIVATE_SUCCESS:
			return assign( {}, state, {
				[ action.module ]: assign( {}, state[ action.module ], { activated: false } ),
			} );
		case JETPACK_MODULE_UPDATE_OPTIONS_SUCCESS:
			const updatedModule = assign( {}, state[ action.module ] );
			Object.keys( action.newOptionValues ).forEach( key => {
				updatedModule.options[ key ].current_value = action.newOptionValues[ key ];
			} );
			return assign( {}, state, {
				[ action.module ]: updatedModule,
			} );
		default:
			return state;
	}
};

export const initialRequestsState = {
	fetchingModulesList: false,
	activating: {},
	deactivating: {},
	updatingOption: {},
};

export const requests = ( state = initialRequestsState, action ) => {
	switch ( action.type ) {
		case JETPACK_MODULES_LIST_FETCH:
			return assign( {}, state, { fetchingModulesList: true } );
		case JETPACK_MODULES_LIST_FETCH_FAIL:
		case JETPACK_MODULES_LIST_RECEIVE:
			return assign( {}, state, { fetchingModulesList: false } );
		case JETPACK_MODULE_ACTIVATE:
			return assign( {}, state, {
				activating: assign( {}, state.activating, {
					[ action.module ]: true,
				} ),
			} );
		case JETPACK_MODULE_ACTIVATE_FAIL:
		case JETPACK_MODULE_ACTIVATE_SUCCESS:
			return assign( {}, state, {
				activating: assign( {}, state.activating, {
					[ action.module ]: false,
				} ),
			} );
		case JETPACK_MODULE_DEACTIVATE:
			return assign( {}, state, {
				deactivating: assign( {}, state.deactivating, {
					[ action.module ]: true,
				} ),
			} );
		case JETPACK_MODULE_DEACTIVATE_FAIL:
		case JETPACK_MODULE_DEACTIVATE_SUCCESS:
			return assign( {}, state, {
				deactivating: assign( {}, state.deactivating, {
					[ action.module ]: false,
				} ),
			} );
		case JETPACK_MODULE_UPDATE_OPTIONS:
			const updatingOption = assign( {}, state.updatingOption );
			updatingOption[ action.module ] = assign( {}, updatingOption[ action.module ] );
			Object.keys( action.newOptionValues ).forEach( key => {
				updatingOption[ action.module ][ key ] = true;
			} );
			return assign( {}, state, {
				updatingOption: assign( {}, state.updatingOption, updatingOption ),
			} );
		case JETPACK_MODULE_UPDATE_OPTIONS_FAIL:
		case JETPACK_MODULE_UPDATE_OPTIONS_SUCCESS:
			const _updatingOption = assign( {}, state.updatingOption );
			_updatingOption[ action.module ] = assign( {}, _updatingOption[ action.module ] );
			Object.keys( action.newOptionValues ).forEach( key => {
				_updatingOption[ action.module ][ key ] = false;
			} );
			return assign( {}, state, {
				updatingOption: assign( {}, state.updatingOption, _updatingOption ),
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
 * Returns true if currently requesting modules lists or false
 * otherwise.
 *
 * @param  {object}  state -  Global state tree
 * @returns {boolean}         Whether modules are being requested
 */
export function isFetchingModulesList( state ) {
	return state.jetpack.modules.requests.fetchingModulesList ? true : false;
}

/**
 * Returns true if we are currently making a request to activate a module
 *
 * @param  {object}  state -  Global state tree
 * @param  {string}  name -  module name
 * @param name
 * @returns {boolean}         Whether module is being activated
 */
export function isActivatingModule( state, name ) {
	return state.jetpack.modules.requests.activating[ name ] ? true : false;
}

/**
 * Returns true if we are currently making a request to deactivate a module
 *
 * @param  {object}  state -  Global state tree
 * @param  {string}  name -  module name
 * @param name
 * @returns {boolean}         Whether module is being deactivated
 */
export function isDeactivatingModule( state, name ) {
	return state.jetpack.modules.requests.deactivating[ name ] ? true : false;
}

/**
 * Returns true if we are currently making a request to update a module's option
 *
 * @param  {object}  state -  Global state tree
 * @param  {string}  module_slug -  slug of the module to check
 * @param module_slug
 * @param  {string}  option_name -  option key to check if currently updating
 * @param option_name
 * @return {Boolean}         Whether option is being updated on the module
 */
export function isUpdatingModuleOption( state, module_slug, option_name ) {
	return get( state.jetpack.modules.requests.updatingOption, [ module_slug, option_name ], false );
}

/**
 * @param state
 * @param module_slug
 * @param option_name
 */
export function getModuleOption( state, module_slug, option_name ) {
	return get( state.jetpack.modules.items, [
		module_slug,
		'options',
		option_name,
		'current_value',
	] );
}

/**
 * Return a list of key & value pairs admitted.
 *
 * @param  {object}  state  -  Global state tree.
 * @param  {string}  group  -  Slug of the set of settings to check.
 * @param  {string}  setting -  Setting to check for valid values.
 * @param setting
 * @returns {Array}           The list of key => value pairs.
 */
export function getModuleOptionValidValues( state, group, setting ) {
	return get( state.jetpack.modules.items, [ group, 'options', setting, 'enum_labels' ], false );
}

/**
 * Returns an object with jetpack modules descriptions keyed by module name
 *
 * @param  {object} state -  Global state tree
 * @param state
 * @returns {object}       Modules keyed by module name
 */
export function getModules( state ) {
	return state.jetpack.modules.items;
}

/**
 * Returns an array of module slugs for all active modules on the site.
 *
 * @param  {object} state - Global state tree
 * @returns {Array}         Array of module slugs.
 */
export function getActiveModules( state ) {
	return Object.keys( state.jetpack.modules.items ).filter(
		module_slug => state.jetpack.modules.items[ module_slug ].activated
	);
}

/**
 * Returns a module object by its name as present in the state
 *
 * @param  {object} state -  Global state tree
 * @param state
 * @param  {string}  name -  module name
 * @param name
 * @returns {Object}       Module description
 */
export function getModule( state, name ) {
	return get( state.jetpack.modules.items, name, {} );
}

/**
 * Returns an array of modules that match a given feature
 *
 * Module features are defined in the module's header comments
 *
 * @param  {object} state  -  Global state tree
 * @param  {string} feature -  Feature to select
 * @param feature
 * @returns {Array}          Array of modules that match the feature.
 */
export function getModulesByFeature( state, feature ) {
	return Object.keys( state.jetpack.modules.items )
		.filter( name => state.jetpack.modules.items[ name ].feature.indexOf( feature ) !== -1 )
		.map( name => state.jetpack.modules.items[ name ] );
}

/**
 * Returns an array of modules that require connection.
 *
 * The module's header comments indicates if it requires connection or not.
 *
 * @param  {object} state  -  Global state tree
 * @returns {Array}          Array of modules that require connection.
 */
export function getModulesThatRequireConnection( state ) {
	return Object.keys( state.jetpack.modules.items ).filter(
		module_slug => state.jetpack.modules.items[ module_slug ].requires_connection
	);
}

/**
 * Returns an array of modules that require user to be connected.
 *
 * The module's header comments indicates if it requires user connection or not.
 *
 * @param  {object} state - Global state tree
 * @returns {Array} Array of modules that require user connection.
 */
export function getModulesThatRequireUserConnection( state ) {
	return Object.keys( state.jetpack.modules.items ).filter(
		module_slug => state.jetpack.modules.items[ module_slug ].requires_user_connection
	);
}

/**
 * Check that the module list includes at least one of these modules.
 *
 * @param  {object} state  -  Global state tree
 * @param  {Array}   modules -  Modules that are probably included in the module list.
 * @param modules
 * @returns {boolean}         True if at least one of the modules is included in the list.
 */
export function hasAnyOfTheseModules( state, modules = [] ) {
	const moduleList = Object.keys( getModules( state ) );
	return 0 < intersection( moduleList, modules ).length;
}

/**
 * Check that the site has any of the performance features available.
 *
 * @param  {object} state  -  Global state tree
 * @returns {boolean}        True if at least one of the performance features is available
 */
export function hasAnyPerformanceFeature( state ) {
	return hasAnyOfTheseModules( state, [
		'carousel',
		'lazy-images',
		'photon',
		'photon-cdn',
		'search',
		'videopress',
	] );
}

/**
 * Returns true if the module is activated
 *
 * @param  {object}  state -  Global state tree
 * @param state
 * @param  {string}  name -  A module's name
 * @returns {boolean}       Weather a module is activated
 */
export function isModuleActivated( state, name ) {
	return get( state.jetpack.modules.items, [ name, 'activated' ], false ) ? true : false;
}

/**
 * Returns true if the module is available.
 *
 * @param  {object}  state     -  Global state tree.
 * @param  {string}  moduleSlug -  The slug of a module.
 * @param moduleSlug
 * @returns {boolean}            Whether a module is available to be displayed in the dashboard.
 */
export function isModuleAvailable( state, moduleSlug ) {
	return includes( Object.keys( state.jetpack.modules.items ), moduleSlug );
}

/**
 * Returns the module override for a given module slug.
 *
 * Expected values are false if no override, 'active' if module forced on,
 * or 'inactive' if module forced off.
 *
 * @param {object} state - Global state tree
 * @param {string} name  - A module's name
 * @returns {boolean | string} Whether the module is overriden, and if so, how.
 */
export function getModuleOverride( state, name ) {
	return get( state.jetpack.modules.items, [ name, 'override' ], false );
}

/**
 * Returns true if the module is forced to be active.
 *
 * @param {object}   state - Global state tree
 * @param {string}   name  - A module's name
 * @returns {boolean}       Whether the module is forced to be active.
 */
export function isModuleForcedActive( state, name ) {
	return getModuleOverride( state, name ) === 'active';
}

/**
 * Returns true if the module is forced to be inactive.
 *
 * @param {object}   state - Global state tree
 * @param {string}   name  - A module's name
 * @returns {boolean}       Whether the module is forced to be inactive.
 */
export function isModuleForcedInactive( state, name ) {
	return getModuleOverride( state, name ) === 'inactive';
}

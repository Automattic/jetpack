import { assign, get } from 'lodash';
import { combineReducers } from 'redux';
import {
	WAF_SETTINGS_FETCH,
	WAF_SETTINGS_FETCH_RECEIVE,
	WAF_SETTINGS_FETCH_FAIL,
} from 'state/action-types';

export const data = ( state = {}, action ) => {
	switch ( action.type ) {
		case WAF_SETTINGS_FETCH_RECEIVE:
			return assign( {}, state, {
				bootstrapPath: action.settings?.bootstrapPath,
				hasRulesAccess: action.settings?.hasRulesAccess,
			} );
		default:
			return state;
	}
};

export const initialRequestsState = {
	isFetchingWafSettings: false,
};

export const requests = ( state = initialRequestsState, action ) => {
	switch ( action.type ) {
		case WAF_SETTINGS_FETCH:
			return assign( {}, state, {
				isFetchingWafSettings: true,
			} );
		case WAF_SETTINGS_FETCH_RECEIVE:
		case WAF_SETTINGS_FETCH_FAIL:
			return assign( {}, state, {
				isFetchingWafSettings: false,
			} );
		default:
			return state;
	}
};

export const reducer = combineReducers( {
	data,
	requests,
} );

/**
 * Returns true if currently requesting the firewall bootstrap file path. Otherwise false.
 *
 * @param  {object}  state - Global state tree
 * @returns {boolean}      Whether the bootstrap path is being requested
 */
export function isFetchingWafSettings( state ) {
	return !! state.jetpack.waf.requests.isFetchingWafSettings;
}

/**
 * Returns the firewall's bootstrap.php file path.
 *
 * @param  {object}  state - Global state tree
 * @returns {string}  File path to bootstrap.php
 */
export function getWafBootstrapPath( state ) {
	return get( state.jetpack.waf, [ 'data', 'bootstrapPath' ], '' );
}

/**
 * Returns whether the site has access to latest firewall rules.
 *
 * @param {object}  state - Global state tree
 * @returns {boolean}  True when the site has access to latest firewall rules.
 */
export function getWafHasRulesAccess( state ) {
	return get( state.jetpack.waf, [ 'data', 'hasRulesAccess' ], false );
}

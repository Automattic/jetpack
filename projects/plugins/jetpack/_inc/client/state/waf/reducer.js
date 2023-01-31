import { assign, get } from 'lodash';
import { combineReducers } from 'redux';
import {
	WAF_SETTINGS_FETCH,
	WAF_SETTINGS_FETCH_RECEIVE,
	WAF_SETTINGS_FETCH_FAIL,
	WAF_IP_ALLOW_LIST_UPDATED,
} from 'state/action-types';

export const data = ( state = {}, action ) => {
	switch ( action.type ) {
		case WAF_SETTINGS_FETCH_RECEIVE:
			return assign( {}, state, {
				bootstrapPath: action.settings?.bootstrap_path,
				automaticRulesAvailable: action.settings?.automatic_rules_available,
			} );
		case WAF_IP_ALLOW_LIST_UPDATED:
			return assign( {}, state, {
				allowListState: action.allowList,
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
 * Returns true if the firewall has automatic rules available.
 *
 * @param {object} state - Global state tree
 * @returns {boolean} Whether the firewall has automatic rules available
 */
export function getAutomaticRulesAvailable( state ) {
	return get( state.jetpack.waf, [ 'data', 'automaticRulesAvailable' ], false );
}

/**
 * Returns the current contents of the allow list text box.
 *
 * @param {object} state - Global state tree
 * @returns {string|null} IP allow list, or null when not set.
 */
export function getWafIpAllowListState( state ) {
	return get( state.jetpack.waf, [ 'data', 'allowListState' ], null );
}

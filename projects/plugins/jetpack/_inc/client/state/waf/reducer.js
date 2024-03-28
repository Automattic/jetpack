import { assign, get } from 'lodash';
import { combineReducers } from 'redux';
import {
	WAF_SETTINGS_FETCH,
	WAF_SETTINGS_FETCH_RECEIVE,
	WAF_SETTINGS_FETCH_FAIL,
	WAF_IP_ALLOW_LIST_UPDATED,
	WAF_SETTINGS_UPDATE,
	WAF_SETTINGS_UPDATE_SUCCESS,
	WAF_SETTINGS_UPDATE_FAIL,
} from 'state/action-types';

export const data = ( state = {}, action ) => {
	switch ( action.type ) {
		case WAF_SETTINGS_FETCH_RECEIVE:
		case WAF_SETTINGS_UPDATE_SUCCESS:
			return assign( {}, state, {
				bootstrapPath: action.settings?.bootstrap_path,
				automaticRulesAvailable: Boolean( action.settings?.automatic_rules_available ),
				automaticRulesEnabled: Boolean( action.settings?.jetpack_waf_automatic_rules ),
				manualRulesEnabled: Boolean( action.settings?.jetpack_waf_ip_list ),
				ipAllowList: action.settings?.jetpack_waf_ip_allow_list || '',
				allowListInputState:
					state.allowListInputState === undefined
						? action.settings?.jetpack_waf_ip_allow_list
						: state.allowListInputState,
				ipBlockList: action.settings?.jetpack_waf_ip_block_list || '',
				shareData: Boolean( action.settings?.jetpack_waf_share_data ),
				standaloneMode: Boolean( action.settings?.standalone_mode ),
				shareDebugData: Boolean( action.settings?.jetpack_waf_share_debug_data ),
			} );
		case WAF_IP_ALLOW_LIST_UPDATED:
			return assign( {}, state, {
				allowListInputState: action.allowList,
			} );
		default:
			return state;
	}
};

export const initialRequestsState = {
	isFetchingWafSettings: false,
	isUpdatingWafSettings: false,
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
		case WAF_SETTINGS_UPDATE:
			return assign( {}, state, {
				isUpdatingWafSettings: true,
			} );
		case WAF_SETTINGS_UPDATE_SUCCESS:
		case WAF_SETTINGS_UPDATE_FAIL:
			return assign( {}, state, {
				isUpdatingWafSettings: false,
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
 * Returns true if currently requesting the firewall settings. Otherwise false.
 *
 * @param {object} state - Global state tree
 * @returns {boolean} Whether the firewall settings are being requested
 */
export function isFetchingWafSettings( state ) {
	return !! state.jetpack.waf.requests.isFetchingWafSettings;
}

/**
 * Returns true if currently updating the firewall settings. Otherwise false.
 *
 * @param {object}  state - Global state tree
 * @returns {boolean} Whether the firewall settings are being requested
 */
export function isUpdatingWafSettings( state ) {
	return !! state.jetpack.waf.requests.isUpdatingWafSettings;
}

/**
 * Returns the firewall's settings.
 *
 * @param {object} state - Global state tree
 * @returns {string}  File path to bootstrap.php
 */
export function getWafSettings( state ) {
	return get( state.jetpack.waf, [ 'data' ], {} );
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
export function getWafIpAllowListInputState( state ) {
	return get( state.jetpack.waf, [ 'data', 'allowListInputState' ], null );
}

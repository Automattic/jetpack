import restApi from '@automattic/jetpack-api';
import {
	WAF_SETTINGS_FETCH,
	WAF_SETTINGS_FETCH_RECEIVE,
	WAF_SETTINGS_FETCH_FAIL,
	WAF_IP_ALLOW_LIST_UPDATED,
	WAF_SETTINGS_UPDATE,
	WAF_SETTINGS_UPDATE_SUCCESS,
	WAF_SETTINGS_UPDATE_FAIL,
} from 'state/action-types';

export const fetchWafSettings = () => {
	return dispatch => {
		dispatch( {
			type: WAF_SETTINGS_FETCH,
		} );
		return restApi
			.fetchWafSettings()
			.then( settings => {
				dispatch( {
					type: WAF_SETTINGS_FETCH_RECEIVE,
					settings,
				} );
				return settings;
			} )
			.catch( error => {
				dispatch( {
					type: WAF_SETTINGS_FETCH_FAIL,
					error: error,
				} );
			} );
	};
};

/**
 * Update WAF IP Allow List
 *
 * @param {string} allowList - The new IP allow list value.
 * @returns {Function} - The action.
 */
export const updateWafIpAllowList = allowList => {
	return dispatch => {
		dispatch( {
			type: WAF_IP_ALLOW_LIST_UPDATED,
			allowList,
		} );
	};
};

/**
 * Update WAF Settings
 *
 * @param {object}  newSettings                    - The new settings to be saved.
 * @param {boolean} newSettings.manualRulesEnabled - Whether manual rules are enabled.
 * @param {string}  newSettings.ipAllowList        - The IP allow list.
 * @param {string}  newSettings.ipBlockList        - The IP block list.
 * @param {boolean} newSettings.shareData          - Whether to share data.
 * @param {boolean} newSettings.shareDebugData     - Whether to share detailed data.
 * @returns {Function} - The action.
 */
export const updateWafSettings = newSettings => {
	return dispatch => {
		dispatch( {
			type: WAF_SETTINGS_UPDATE,
		} );
		return restApi
			.updateWafSettings( {
				jetpack_waf_automatic_rules: newSettings.automaticRulesEnabled,
				jetpack_waf_ip_list: newSettings.manualRulesEnabled,
				jetpack_waf_ip_allow_list: newSettings.ipAllowList,
				jetpack_waf_ip_block_list: newSettings.ipBlockList,
				jetpack_waf_share_data: newSettings.shareData,
				jetpack_waf_share_debug_data: newSettings.shareDebugData,
			} )
			.then( settings => {
				dispatch( {
					type: WAF_SETTINGS_UPDATE_SUCCESS,
					settings,
				} );
				return settings;
			} )
			.catch( error => {
				dispatch( {
					type: WAF_SETTINGS_UPDATE_FAIL,
					error: error,
				} );

				throw error;
			} );
	};
};

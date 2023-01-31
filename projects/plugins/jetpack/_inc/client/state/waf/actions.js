import restApi from '@automattic/jetpack-api';
import {
	WAF_SETTINGS_FETCH,
	WAF_SETTINGS_FETCH_RECEIVE,
	WAF_SETTINGS_FETCH_FAIL,
	WAF_IP_ALLOW_LIST_UPDATED,
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

export const updateWafIpAllowList = allowList => {
	return dispatch => {
		dispatch( {
			type: WAF_IP_ALLOW_LIST_UPDATED,
			allowList,
		} );
	};
};

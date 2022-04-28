/**
 * Internal dependencies
 */
import {
	WAF_SETTINGS_FETCH,
	WAF_SETTINGS_FETCH_RECEIVE,
	WAF_SETTINGS_FETCH_FAIL,
	WAF_ACTIVATION,
	WAF_ACTIVATION_RECEIVE,
	WAF_ACTIVATION_FAIL,
	WAF_DEACTIVATION,
	WAF_DEACTIVATION_RECEIVE,
	WAF_DEACTIVATION_FAIL,
} from 'state/action-types';
import restApi from '@automattic/jetpack-api';

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

export const activateWaf = () => {
	return dispatch => {
		dispatch( {
			type: WAF_ACTIVATION,
		} );

		return restApi
			.activateWaf()
			.then( response => {
				dispatch( {
					type: WAF_ACTIVATION_RECEIVE,
					response,
				} );
				return response;
			} )
			.catch( error => {
				dispatch( {
					type: WAF_ACTIVATION_FAIL,
					error: error,
				} );
			} );
	};
};

export const deactivateWaf = () => {
	return dispatch => {
		dispatch( {
			type: WAF_DEACTIVATION,
		} );
		return restApi
			.deactivateWaf()
			.then( response => {
				dispatch( {
					type: WAF_DEACTIVATION_RECEIVE,
					response,
				} );
				return response;
			} )
			.catch( error => {
				dispatch( {
					type: WAF_DEACTIVATION_FAIL,
					error: error,
				} );
			} );
	};
};

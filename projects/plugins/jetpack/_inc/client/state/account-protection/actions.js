import restApi from '@automattic/jetpack-api';
import {
	ACCOUNT_PROTECTION_SETTINGS_FETCH,
	ACCOUNT_PROTECTION_SETTINGS_FETCH_RECEIVE,
	ACCOUNT_PROTECTION_SETTINGS_FETCH_FAIL,
	ACCOUNT_PROTECTION_SETTINGS_UPDATE,
	ACCOUNT_PROTECTION_SETTINGS_UPDATE_SUCCESS,
	ACCOUNT_PROTECTION_SETTINGS_UPDATE_FAIL,
} from 'state/action-types';

export const fetchAccountProtectionSettings = () => {
	return dispatch => {
		dispatch( {
			type: ACCOUNT_PROTECTION_SETTINGS_FETCH,
		} );
		return restApi
			.fetchAccountProtectionSettings()
			.then( settings => {
				dispatch( {
					type: ACCOUNT_PROTECTION_SETTINGS_FETCH_RECEIVE,
					settings,
				} );
				return settings;
			} )
			.catch( error => {
				dispatch( {
					type: ACCOUNT_PROTECTION_SETTINGS_FETCH_FAIL,
					error: error,
				} );
			} );
	};
};

/**
 * Update Account Protection Settings
 *
 * @param {object}  newSettings            - The new settings to be saved.
 * @param {boolean} newSettings.strictMode - Whether strict mode is enabled.
 * @return {Function} - The action.
 */
export const updateAccountProtectionSettings = newSettings => {
	return dispatch => {
		dispatch( {
			type: ACCOUNT_PROTECTION_SETTINGS_UPDATE,
		} );
		return restApi
			.updateAccountProtectionSettings( {
				jetpack_account_protection_strict_mode: newSettings.strictMode,
			} )
			.then( settings => {
				dispatch( {
					type: ACCOUNT_PROTECTION_SETTINGS_UPDATE_SUCCESS,
					settings,
				} );
				return settings;
			} )
			.catch( error => {
				dispatch( {
					type: ACCOUNT_PROTECTION_SETTINGS_UPDATE_FAIL,
					error: error,
				} );

				throw error;
			} );
	};
};

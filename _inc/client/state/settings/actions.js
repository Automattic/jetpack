/**
 * Internal dependencies
 */
import {
	JETPACK_SETTINGS_FETCH,
	JETPACK_SETTINGS_FETCH_RECEIVE,
	JETPACK_SETTINGS_FETCH_FAIL,
	JETPACK_SETTING_UPDATE,
	JETPACK_SETTING_UPDATE_SUCCESS,
	JETPACK_SETTING_UPDATE_FAIL
} from 'state/action-types';
import restApi from 'rest-api';

export const fetchSettings = () => {
	return ( dispatch ) => {
		dispatch( {
			type: JETPACK_SETTINGS_FETCH
		} );
		return restApi.fetchSettings().then( settings => {
			dispatch( {
				type: JETPACK_SETTINGS_FETCH_RECEIVE,
				settings: settings
			} );
			return settings;
		} ).catch( error => {
			dispatch( {
				type: JETPACK_SETTINGS_FETCH_FAIL,
				error: error
			} );
		} );
	}
};

export const updateSetting = ( updatedOption ) => {
	return ( dispatch ) => {
		dispatch( {
			type: JETPACK_SETTING_UPDATE,
			updatedOption
		} );
		return restApi.updateSetting( updatedOption ).then( success => {
			dispatch( {
				type: JETPACK_SETTING_UPDATE_SUCCESS,
				updatedOption,
				success: success
			} );
		} ).catch( error => {
			dispatch( {
				type: JETPACK_SETTING_UPDATE_FAIL,
				success: false,
				error: error,
				updatedOption
			} );
		} );
	}
};

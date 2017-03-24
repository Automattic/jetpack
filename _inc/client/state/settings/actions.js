/**
 * External dependencies
 */
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import {
	JETPACK_SETTINGS_FETCH,
	JETPACK_SETTINGS_FETCH_RECEIVE,
	JETPACK_SETTINGS_FETCH_FAIL,
	JETPACK_SETTING_UPDATE,
	JETPACK_SETTING_UPDATE_SUCCESS,
	JETPACK_SETTING_UPDATE_FAIL,
	JETPACK_SETTINGS_UPDATE,
	JETPACK_SETTINGS_UPDATE_SUCCESS,
	JETPACK_SETTINGS_UPDATE_FAIL,
	JETPACK_SETTINGS_SET_UNSAVED_FLAG,
	JETPACK_SETTINGS_CLEAR_UNSAVED_FLAG
} from 'state/action-types';
import {
	maybeHideNavMenuItem,
	maybeReloadAfterAction
} from 'state/modules';
import restApi from 'rest-api';

export const setUnsavedSettingsFlag = () => {
	return ( {
		type: JETPACK_SETTINGS_SET_UNSAVED_FLAG
	} );
};

export const clearUnsavedSettingsFlag = () => {
	return ( {
		type: JETPACK_SETTINGS_CLEAR_UNSAVED_FLAG
	} );
};

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
	};
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
	};
};

export const updateSettings = ( newOptionValues, type = '' ) => {
	return ( dispatch ) => {
		let messages = {
				success: __( 'Updated settings.' ),
				error: error => __( 'Error updating settings. %(error)s', { args: { error: error } } )
			},
			updatedOptionsSuccess = () => newOptionValues;

		// Adapt messages and data when regenerating Post by Email address
		if ( 'regeneratePbE' === type ) {
			messages = {
				success: __( 'Regenerated Post by Email address.' ),
				error: error => __( 'Error regenerating Post by Email address. %(error)s', { args: { error: error } } )
			};
			updatedOptionsSuccess = success => {
				return {
					post_by_email_address: success.post_by_email_address
				};
			};
			newOptionValues = { post_by_email_address: 'regenerate' };
		}

		// Adapt message for masterbar toggle, since it needs to reload.
		if ( 'object' === typeof newOptionValues && 'masterbar' in newOptionValues ) {
			messages = {
				success: __( 'Updated settings. Refreshing page…' )
			};
		}

		dispatch( {
			type: JETPACK_SETTINGS_UPDATE,
			updatedOptions: newOptionValues
		} );

		return restApi.updateSettings( newOptionValues ).then( success => {
			dispatch( {
				type: JETPACK_SETTINGS_UPDATE_SUCCESS,
				updatedOptions: updatedOptionsSuccess( success ),
				success: success
			} );
			maybeHideNavMenuItem( newOptionValues );
			maybeReloadAfterAction( newOptionValues );

			dispatch( removeNotice( 'module-setting-update' ) );
			dispatch( createNotice(
				'is-success',
				messages.success,
				{ id: 'module-setting-update', duration: 2000 }
			) );
		} ).catch( error => {
			dispatch( {
				type: JETPACK_SETTINGS_UPDATE_FAIL,
				success: false,
				error: error,
				updatedOptions: newOptionValues
			} );

			dispatch( removeNotice( 'module-setting-update' ) );
			dispatch( createNotice(
				'is-error',
				messages.error( error ),
				{ id: 'module-setting-update' }
			) );
		} );
	};
};

import restApi from '@automattic/jetpack-api';
import { __, sprintf } from '@wordpress/i18n';
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
import {
	USER_TRACKING_SETTINGS_FETCH,
	USER_TRACKING_SETTINGS_FETCH_FAIL,
	USER_TRACKING_SETTINGS_FETCH_SUCCESS,
	USER_TRACKING_SETTINGS_UPDATE,
	USER_TRACKING_SETTINGS_UPDATE_FAIL,
	USER_TRACKING_SETTINGS_UPDATE_SUCCESS,
} from 'state/action-types';

export const fetchTrackingSettings = () => {
	return dispatch => {
		dispatch( {
			type: USER_TRACKING_SETTINGS_FETCH,
		} );
		return restApi
			.fetchUserTrackingSettings()
			.then( settings => {
				dispatch( {
					type: USER_TRACKING_SETTINGS_FETCH_SUCCESS,
					settings: settings,
				} );
				return settings;
			} )
			.catch( error => {
				dispatch( {
					type: USER_TRACKING_SETTINGS_FETCH_FAIL,
					error: error,
				} );
			} );
	};
};

export const updateTrackingSettings = newSettings => {
	return dispatch => {
		const messages = {
				progress: __( 'Updating privacy settings…', 'jetpack' ),
				success: __( 'Updated privacy settings.', 'jetpack' ),
				// We try to get a message or an error code if this is an unexpected WP_Error coming from the API.
				// Otherwise we try to show error.name (coming from the custom errors defined in rest-api/index.js and if that's not useful
				// then we try to let Javascript stringify the error object.
				error: error =>
					sprintf(
						/* translators: placeholder is an error message. */
						__( 'Error updating privacy settings. %s', 'jetpack' ),
						error.message || error.code || error.name || error
					),
			},
			updatedSettingsSuccess = () => newSettings;

		dispatch( removeNotice( 'tracking-settings-update' ) );
		dispatch( removeNotice( 'tracking-settings-update-success' ) );

		dispatch( createNotice( 'is-info', messages.progress, { id: 'tracking-settings-update' } ) );

		dispatch( {
			type: USER_TRACKING_SETTINGS_UPDATE,
			updatedSettings: newSettings,
		} );

		return restApi
			.updateUserTrackingSettings( newSettings )
			.then( success => {
				dispatch( {
					type: USER_TRACKING_SETTINGS_UPDATE_SUCCESS,
					updatedSettings: updatedSettingsSuccess( success ),
					success: success,
				} );

				dispatch( removeNotice( 'tracking-settings-update' ) );
				dispatch( removeNotice( 'tracking-settings-update-success' ) );

				dispatch(
					createNotice( 'is-success', messages.success, {
						id: 'tracking-settings-update-success',
						duration: 2000,
					} )
				);
			} )
			.catch( error => {
				dispatch( {
					type: USER_TRACKING_SETTINGS_UPDATE_FAIL,
					updatedSettings: newSettings,
					success: false,
					error: error,
				} );

				dispatch( removeNotice( 'tracking-settings-update' ) );
				dispatch( removeNotice( 'tracking-settings-update-success' ) );

				dispatch(
					createNotice( 'is-error', messages.error( error ), { id: 'tracking-settings-update' } )
				);
			} );
	};
};

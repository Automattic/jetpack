import restApi from '@automattic/jetpack-api';
import { __, sprintf } from '@wordpress/i18n';
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
import { get, some } from 'lodash';
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
	JETPACK_SETTINGS_CLEAR_UNSAVED_FLAG,
} from 'state/action-types';
import { maybeHideNavMenuItem, maybeReloadAfterAction } from 'state/modules';

export const setUnsavedSettingsFlag = () => {
	return {
		type: JETPACK_SETTINGS_SET_UNSAVED_FLAG,
	};
};

export const clearUnsavedSettingsFlag = () => {
	return {
		type: JETPACK_SETTINGS_CLEAR_UNSAVED_FLAG,
	};
};

export const fetchSettings = () => {
	return dispatch => {
		dispatch( {
			type: JETPACK_SETTINGS_FETCH,
		} );
		return restApi
			.fetchSettings()
			.then( settings => {
				dispatch( {
					type: JETPACK_SETTINGS_FETCH_RECEIVE,
					settings: settings,
				} );
				return settings;
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_SETTINGS_FETCH_FAIL,
					error: error,
				} );
			} );
	};
};

export const updateSetting = updatedOption => {
	return dispatch => {
		dispatch( {
			type: JETPACK_SETTING_UPDATE,
			updatedOption,
		} );
		return restApi
			.updateSetting( updatedOption )
			.then( success => {
				dispatch( {
					type: JETPACK_SETTING_UPDATE_SUCCESS,
					updatedOption,
					success: success,
				} );
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_SETTING_UPDATE_FAIL,
					success: false,
					error: error,
					updatedOption,
				} );
			} );
	};
};

export const updateSettings = ( newOptionValues, noticeMessages = {} ) => {
	return dispatch => {
		const messages = {
			progress: __( 'Updating settings…', 'jetpack' ),
			success: __( 'Updated settings.', 'jetpack' ),
			// We try to get a message or an error code if this is an unexpected WP_Error coming from the API.
			// Otherwise we try to show error.name (coming from the custom errors defined in rest-api/index.js and if that's not useful
			// then we try to let Javascript stringify the error object.
			error: error =>
				sprintf(
					/* translators: placeholder is an error code or an error message. */
					__( 'Error updating settings. %s', 'jetpack' ),
					error.message || error.code || error.name || error
				),
			...noticeMessages,
		};

		// Changes to these options affect WordPress.com Toolbar appearance,
		// and we need to reload the page for them to take effect.
		const reloadForOptionValues = [ 'masterbar', 'jetpack_testimonial', 'jetpack_portfolio' ];

		// Adapt message for masterbar toggle, since it needs to reload.
		if (
			'object' === typeof newOptionValues &&
			some( reloadForOptionValues, optionValue => optionValue in newOptionValues )
		) {
			messages.success = __( 'Updated settings. Refreshing page…', 'jetpack' );
		}

		dispatch( removeNotice( 'module-setting-update' ) );
		dispatch( removeNotice( 'module-setting-update-success' ) );

		const suppressNoticeFor = [
			'dismiss_dash_app_card',
			'dismiss_empty_stats_card',
			'dismiss_dash_backup_getting_started',
			'dismiss_dash_agencies_learn_more',
		];
		if (
			'object' === typeof newOptionValues &&
			! some( suppressNoticeFor, optionValue => optionValue in newOptionValues )
		) {
			dispatch( createNotice( 'is-info', messages.progress, { id: 'module-setting-update' } ) );
		}

		dispatch( {
			type: JETPACK_SETTINGS_UPDATE,
			updatedOptions: newOptionValues,
		} );

		return restApi
			.updateSettings( newOptionValues )
			.then( success => {
				dispatch( {
					type: JETPACK_SETTINGS_UPDATE_SUCCESS,
					updatedOptions: mapUpdateSettingsResponseFromApi( success, newOptionValues ),
					success: success,
				} );
				maybeHideNavMenuItem( newOptionValues );
				maybeReloadAfterAction( newOptionValues );

				dispatch( removeNotice( 'module-setting-update' ) );
				dispatch( removeNotice( 'module-setting-update-success' ) );
				if (
					'object' === typeof newOptionValues &&
					! some( suppressNoticeFor, optionValue => optionValue in newOptionValues )
				) {
					dispatch(
						createNotice( 'is-success', messages.success, {
							id: 'module-setting-update-success',
							duration: 2000,
						} )
					);
				}
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_SETTINGS_UPDATE_FAIL,
					success: false,
					error: error,
					updatedOptions: newOptionValues,
				} );

				dispatch( removeNotice( 'module-setting-update' ) );
				dispatch(
					createNotice( 'is-error', messages.error( error ), { id: 'module-setting-update' } )
				);
			} );
	};
};

/**
 * Maps the response from the API for handling special cases
 * like with regeneration of Post By Email where we need the new address from the response
 * @param {object} success           The JSON response from the API
 * @param {object} requestedValues The object holding the requested value changes for settings.
 * @returns {object}                 The mapped object.
 */
function mapUpdateSettingsResponseFromApi( success, requestedValues ) {
	let values = requestedValues;

	// Adapt messages and data when regenerating Post by Email address
	if ( get( requestedValues, 'post_by_email_address' ) === 'regenerate' ) {
		values = {
			post_by_email_address: success.post_by_email_address,
		};
	}
	return values;
}

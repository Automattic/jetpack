/**
 * External dependencies
 */
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
import { translate as __ } from 'i18n-calypso';
import some from 'lodash/some';

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
	maybeReloadAfterAction,
	maybeSetAnalyticsOptOut
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
			maybeSetAnalyticsOptOut( updatedOption );
		} );
	};
};

export const updateSettings = ( newOptionValues, type = '' ) => {
	return ( dispatch ) => {
		let messages = {
				progress: __( 'Updating settings…' ),
				success: __( 'Updated settings.' ),
				// We try to get a message or an error code if this is an unexpected WP_Error coming from the API.
				// Otherwise we try to show error.name (coming from the custom errors defined in rest-api/index.js and if that's not useful
				// then we try to let Javascript stringify the error object.
				error: error => __( 'Error updating settings. %(error)s', { args: { error: error.message || error.code || error.name || error } } )
			},
			updatedOptionsSuccess = () => newOptionValues;

		// Adapt messages and data when regenerating Post by Email address
		if ( 'regeneratePbE' === type ) {
			messages = {
				progress: __( 'Updating Post by Email address…' ),
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

		// Changes to these options affect WordPress.com Toolbar appearance,
		// and we need to reload the page for them to take effect.
		const reloadForOptionValues = [ 'masterbar', 'jetpack_testimonial', 'jetpack_portfolio' ];

		// Adapt message for masterbar toggle, since it needs to reload.
		if ( 'object' === typeof newOptionValues && some( reloadForOptionValues, ( optionValue ) => optionValue in newOptionValues ) ) {
			messages.success = __( 'Updated settings. Refreshing page…' );
		}

		dispatch( removeNotice( 'module-setting-update' ) );
		dispatch( removeNotice( 'module-setting-update-success' ) );

		const suppressNoticeFor = [ 'dismiss_dash_app_card', 'dismiss_empty_stats_card', 'show_welcome_for_new_plan' ];
		if ( 'object' === typeof newOptionValues && ! some( suppressNoticeFor, ( optionValue ) => optionValue in newOptionValues ) ) {
			dispatch( createNotice(
				'is-info',
				messages.progress,
				{ id: 'module-setting-update' }
			) );
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
			maybeSetAnalyticsOptOut( newOptionValues );

			dispatch( removeNotice( 'module-setting-update' ) );
			dispatch( removeNotice( 'module-setting-update-success' ) );
			if ( 'object' === typeof newOptionValues && ! some( suppressNoticeFor, ( optionValue ) => optionValue in newOptionValues ) ) {
				dispatch( createNotice(
					'is-success',
					messages.success,
					{ id: 'module-setting-update-success', duration: 2000 }
				) );
			}
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

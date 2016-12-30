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
import { maybeHideNavMenuItem } from 'state/modules';
import restApi from 'rest-api';

export const setUnsavedSettingsFlag = () => {
	return ( {
		type: JETPACK_SETTINGS_SET_UNSAVED_FLAG
	} );
}

export const clearUnsavedSettingsFlag = () => {
	return ( {
		type: JETPACK_SETTINGS_CLEAR_UNSAVED_FLAG
	} );
}

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

export const updateSettings = ( newOptionValues ) => {
	return ( dispatch, getState ) => {

		dispatch( removeNotice( `module-setting-update` ) );
		dispatch( createNotice(
			'is-info',
			__( 'Updating settings…' ),
			{ id: `module-setting-update` }
		) );
		dispatch( {
			type: JETPACK_SETTINGS_UPDATE
		} );

		return restApi.updateSettings( newOptionValues ).then( success => {
			dispatch( {
				type: JETPACK_SETTINGS_UPDATE_SUCCESS,
				updatedOptions: newOptionValues,
				success: success
			} );
			maybeHideNavMenuItem( newOptionValues );

			dispatch( removeNotice( `module-setting-update` ) );
			dispatch( createNotice(
				'is-success',
				__( 'Updated settings.' ),
				{ id: `module-setting-update` }
			) );
		} ).catch( error => {
			dispatch( {
				type: JETPACK_SETTINGS_UPDATE_FAIL,
				success: false,
				error: error,
				updatedOptions: newOptionValues
			} );

			dispatch( removeNotice( `module-setting-update` ) );
			dispatch( createNotice(
				'is-error',
				__( 'Error updating settings. %(error)s', {
					args: {
						error: error
					}
				} ),
				{ id: `module-setting-update` }
			) );
		} );
	};
};

export const regeneratePostByEmailAddress = () => {
	return ( dispatch, getState ) => {

		const newOptionValues = {
			post_by_email_address: 'regenerate'
		};

		dispatch( removeNotice( `module-setting-update` ) );
		dispatch( createNotice(
			'is-info',
			__( 'Updating Post by Email address…' ),
			{ id: `module-setting-update` }
		) );
		dispatch( {
			type: JETPACK_SETTINGS_UPDATE
		} );

		return restApi.updateSettings( newOptionValues ).then( success => {
			dispatch( {
				type: JETPACK_SETTINGS_UPDATE_SUCCESS,
				updatedOptions: {
					post_by_email_address: success.post_by_email_address
				},
				success: success
			} );

			dispatch( removeNotice( `module-setting-update` ) );
			dispatch( createNotice(
				'is-success',
				__( 'Regenerated Post by Email address.' ),
				{ id: `module-setting-update` }
			) );
		} ).catch( error => {
			dispatch( {
				type: JETPACK_SETTINGS_UPDATE_FAIL,
				success: false,
				error: error,
				updatedOptions: newOptionValues
			} );

			dispatch( removeNotice( `module-setting-update` ) );
			dispatch( createNotice(
				'is-error',
				__( 'Error regenerating Post by Email address. %(error)s', {
					args: {
						error: error
					}
				} ),
				{ id: `module-setting-update` }
			) );
		} );
	};
};

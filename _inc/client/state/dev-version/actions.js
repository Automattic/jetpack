/**
 * External dependencies
 */
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import {
	RESET_OPTIONS,
	RESET_OPTIONS_FAIL,
	RESET_OPTIONS_SUCCESS
} from 'state/action-types';
import restApi from 'rest-api';

export const resetOptions = ( options ) => {
	return ( dispatch ) => {
		dispatch( {
			type: RESET_OPTIONS
		} );
		dispatch( createNotice( 'is-info', __( 'Resetting Jetpack options…' ), { id: 'reset-options' } ) );
		return restApi.resetOptions( options ).then( () => {
			dispatch( {
				type: RESET_OPTIONS_SUCCESS
			} );
			dispatch( removeNotice( 'reset-options' ) );
			dispatch( createNotice( 'is-success', __( 'Options reset.' ), { id: 'reset-options' } ) );
		} ).catch( error => {
			dispatch( {
				type: RESET_OPTIONS_FAIL,
				error: error
			} );
			dispatch( removeNotice( 'reset-options' ) );
			dispatch( createNotice( 'is-error', __( 'Options failed to reset.' ), { id: 'reset-options' } ) );
		} );
	}
}

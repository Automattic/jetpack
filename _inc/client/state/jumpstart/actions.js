/**
 * External dependencies
 */
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import {
	JUMPSTART_ACTIVATE,
	JUMPSTART_ACTIVATE_FAIL,
	JUMPSTART_ACTIVATE_SUCCESS,
	JUMPSTART_SKIP,
	JUMPSTART_SKIP_SUCCESS,
	JUMPSTART_SKIP_FAIL
} from 'state/action-types';
import restApi from 'rest-api';

export const jumpStartActivate = () => {
	return ( dispatch ) => {
		dispatch( {
			type: JUMPSTART_ACTIVATE
		} );
		dispatch( removeNotice( 'jumpstart-activate' ) );
		dispatch( createNotice( 'is-info', __( 'Activating recommended features…' ), { id: 'jumpstart-activate' } ) );
		return restApi.jumpStart( 'activate' ).then( () => {
			dispatch( {
				type: JUMPSTART_ACTIVATE_SUCCESS,
				jumpStart: true
			} );
			dispatch( removeNotice( 'jumpstart-activate' ) );
			dispatch( createNotice( 'is-success', __( 'Recommended features active.' ), { id: 'jumpstart-activate' } ) );
		} )['catch']( error => {
			dispatch( {
				type: JUMPSTART_ACTIVATE_FAIL,
				error: error
			} );
			dispatch( removeNotice( 'jumpstart-activate' ) );
			dispatch( createNotice(
				'is-error',
				__( 'Recommended features failed to activate. %(error)d', {
					args: {
						error: error
					}
				} ),
				{ id: 'jumpstart-activate' }
			) );
		} );
	}
}

export const jumpStartSkip = () => {
	return ( dispatch ) => {
		dispatch( {
			type: JUMPSTART_SKIP
		} );
		return restApi.jumpStart( 'deactivate' ).then( () => {
			dispatch( {
				type: JUMPSTART_SKIP_SUCCESS,
				jumpStart: false
			} );
		} )['catch']( error => {
			dispatch( {
				type: JUMPSTART_SKIP_FAIL,
				error: error
			} );
		} );
	}
}

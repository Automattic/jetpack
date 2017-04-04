/**
 * External dependencies
 */
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
import { translate as __ } from 'i18n-calypso';
import { createHistory } from 'history';
import analytics from 'lib/analytics';

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
import { fetchModules } from 'state/modules';

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
			analytics.tracks.recordEvent( 'jetpack_wpa_jumpstart_submit', {} );
			dispatch( removeNotice( 'jumpstart-activate' ) );
			dispatch( createNotice( 'is-success', __( 'Recommended features active.' ), { id: 'jumpstart-activate', duration: 2000 } ) );
			dispatch( fetchModules() );
		} ).catch( error => {
			dispatch( {
				type: JUMPSTART_ACTIVATE_FAIL,
				error: error
			} );
			dispatch( removeNotice( 'jumpstart-activate' ) );
			dispatch( createNotice(
				'is-error',
				__( 'Recommended features failed to activate. %(error)s', {
					args: {
						error: error
					}
				} ),
				{ id: 'jumpstart-activate' }
			) );
		} );
	};
};

const history = createHistory();

export const jumpStartSkip = () => {
	return ( dispatch ) => {
		dispatch( {
			type: JUMPSTART_SKIP
		} );
		analytics.tracks.recordEvent( 'jetpack_wpa_jumpstart_skip', {} );
		history.push( window.location.pathname + '?page=jetpack#/dashboard' );
		return restApi.jumpStart( 'deactivate' ).then( () => {
			dispatch( {
				type: JUMPSTART_SKIP_SUCCESS,
				jumpStart: false
			} );
		} ).catch( error => {
			dispatch( {
				type: JUMPSTART_SKIP_FAIL,
				error: error
			} );
		} );
	};
};

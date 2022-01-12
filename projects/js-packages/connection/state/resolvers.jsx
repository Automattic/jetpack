/**
 * External dependencies
 */
import {dispatch, select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import actions from './actions';
import { STORE_ID } from './store';

const connectionResolvers = {
	*getConnectionStatus() {
		yield actions.setConnectionStatusIsFetching( true );
		const result = yield actions.fetchConnectionStatus();
		yield actions.setConnectionStatusIsFetching( false );
		return actions.setConnectionStatus( result );
	},
	getAuthorizationUrl: {
		isFulfilled: ( state, ...args ) => {
			const hasAuthorization = Boolean( state.authorizationUrl );
			const hasFinishedResolution = select( STORE_ID ).hasFinishedResolution(
				'getAuthorizationUrl',
				args
			);

			if ( ! hasAuthorization ) {
				dispatch( STORE_ID ).invalidateResolution( 'getAuthorizationUrl', args );
			}

			// we need to set finish resolution to fix a problem when using resolveSelect,
			// since it looks for finishResolution to return the value
			// ref: https://github.com/WordPress/gutenberg/blob/5dbf7ca8a285f5cab65ebf7ab87dafeb6118b6aa/packages/data/src/redux-store/index.js#L342
			if ( hasAuthorization && ! hasFinishedResolution ) {
				dispatch( STORE_ID ).finishResolution( 'getAuthorizationUrl', args );
			}

			return hasAuthorization;
		},
		*fulfill( redirectUri ) {
			try {
				const response = yield actions.fetchAuthorizationUrl(redirectUri);
				yield actions.setAuthorizationUrl( response.authorizeUrl );
			} catch ( e ) {
				yield actions.setUserIsConnecting( false );
				yield actions.setSiteIsRegistering( false );
				yield actions.setRegistrationError( e.hasOwnProperty( 'response' ) ? ( ( e.response.hasOwnProperty( 'message' ) && e.response.message ) ? e.response.message : e.response.code ) : e.toString() );
				throw e;
			}
		},
	},
};

export default {
	...connectionResolvers,
};

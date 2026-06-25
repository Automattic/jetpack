import { globalNoticesStore } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';

// Allowlist for the returned `service` query value.
const SUPPORTED_SERVICE_IDS = new Set( [
	'bluesky',
	'facebook',
	'instagram-business',
	'linkedin',
	'mastodon',
	'nextdoor',
	'threads',
	'tumblr',
] );

const FETCH_NOTICE_ID = 'publicize-fetching-keyring';

/**
 * Handles the return from the full-page OAuth connect redirect: fetch the keyring result once,
 * then complete an in-place reconnect or open the confirmation modal. Restores the reconnect
 * context from `reconnect_id` (lost on reload) and strips the return params so a reload can't
 * re-fire it. Mount once, high in the admin page tree.
 */
export function useConnectReturnHandler() {
	const hasRun = useRef( false );

	const {
		fetchKeyringResult,
		setKeyringResult,
		openConnectionsModal,
		completeReconnect,
		setReconnectingAccount,
	} = useDispatch( socialStore );

	const { createInfoNotice, createErrorNotice, removeNotice } = useDispatch( globalNoticesStore );

	const { getConnectionById } = useSelect( select => select( socialStore ), [] );

	useEffect( () => {
		if ( hasRun.current ) {
			return;
		}

		const params = new URLSearchParams( window.location.search );

		if ( params.get( 'connect_return' ) !== '1' ) {
			return;
		}

		const requestId = params.get( 'request_id' );
		const service = params.get( 'service' );

		// Reject anything that isn't a well-formed, expected return.
		if ( ! requestId || ! service || ! SUPPORTED_SERVICE_IDS.has( service ) ) {
			return;
		}

		const source = params.get( 'source' );

		if ( source && source !== 'editor' ) {
			return;
		}

		const reconnectId = params.get( 'reconnect_id' );

		hasRun.current = true;

		// Strip the return params up front so a reload can't re-run this against a consumed result.
		const cleanUrl = new URL( window.location.href );
		[ 'connect_return', 'request_id', 'service', 'source', 'reconnect_id' ].forEach( key =>
			cleanUrl.searchParams.delete( key )
		);
		window.history.replaceState( {}, '', cleanUrl.toString() );

		( async () => {
			createInfoNotice( __( 'Fetching connection details…', 'jetpack-publicize-pkg' ), {
				id: FETCH_NOTICE_ID,
				type: 'snackbar',
				isDismissible: true,
			} );

			try {
				// Restore the reconnect context (lost on the full-page reload) before completing it.
				if ( reconnectId ) {
					const connection = getConnectionById( reconnectId );

					if ( connection ) {
						setReconnectingAccount( connection );
					}
				}

				const data = await fetchKeyringResult( requestId );

				// If this was a reconnect and the account matched, it's handled in place.
				const handled = await completeReconnect( data );

				if ( ! handled ) {
					if ( data?.ID ) {
						setKeyringResult( data );
						openConnectionsModal();
					} else {
						createErrorNotice(
							__(
								'Couldn’t load the connection — please try connecting again.',
								'jetpack-publicize-pkg'
							),
							{ type: 'snackbar', isDismissible: true }
						);
					}
				}
			} finally {
				removeNotice( FETCH_NOTICE_ID );
			}
		} )();
	}, [
		completeReconnect,
		createErrorNotice,
		createInfoNotice,
		fetchKeyringResult,
		getConnectionById,
		openConnectionsModal,
		removeNotice,
		setKeyringResult,
		setReconnectingAccount,
	] );
}

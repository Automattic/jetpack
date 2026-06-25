import { globalNoticesStore } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import { startServiceConnect } from '../../utils';

// Allowlist for the `service`/`connect` query value.
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

// Services that need user input before connecting — can't be auto-redirected.
const NEEDS_INPUT_SERVICE_IDS = new Set( [ 'bluesky', 'mastodon' ] );

const FETCH_NOTICE_ID = 'publicize-fetching-keyring';

/**
 * Drives the full-page OAuth connect flow on the admin page. Handles the editor intent
 * (`?connect=<service>&source=editor` → auto-start the redirect, or open the modal for input-first
 * services) and the return (`?connect_return=1` → fetch the keyring result once, complete an
 * in-place reconnect or open confirmation). Restores reconnect context from `reconnect_id` and
 * strips params so a reload can't re-fire it. Mount once, high in the admin page tree.
 */
export function useConnectReturnHandler() {
	const hasRun = useRef( false );

	const {
		fetchKeyringResult,
		setKeyringResult,
		openConnectionsModal,
		completeReconnect,
		setReconnectingAccount,
		setConnectSource,
	} = useDispatch( socialStore );

	const { createInfoNotice, createErrorNotice, removeNotice } = useDispatch( globalNoticesStore );

	const { getConnectionById, getService } = useSelect( select => select( socialStore ), [] );

	useEffect( () => {
		if ( hasRun.current ) {
			return;
		}

		const params = new URLSearchParams( window.location.search );

		// Editor intent: auto-start a connect for the opened service.
		const intentService = params.get( 'connect' );

		if ( intentService ) {
			const intentSource = params.get( 'source' );

			if ( ! SUPPORTED_SERVICE_IDS.has( intentService ) || intentSource !== 'editor' ) {
				return;
			}

			hasRun.current = true;

			const cleanUrl = new URL( window.location.href );
			[ 'connect', 'source' ].forEach( key => cleanUrl.searchParams.delete( key ) );
			window.history.replaceState( {}, '', cleanUrl.toString() );

			const service = getService( intentService );

			// Pure-OAuth auto-redirects; input-first (or not-yet-loaded) services finish in the modal.
			if ( service?.url && ! NEEDS_INPUT_SERVICE_IDS.has( intentService ) ) {
				startServiceConnect( service.url, intentService, { source: 'editor' } );
			} else {
				openConnectionsModal();
			}

			return;
		}

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

		// Editor-sourced: the confirmation will broadcast + self-close once the connection is made.
		if ( source === 'editor' ) {
			setConnectSource( 'editor' );
		}

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
		getService,
		openConnectionsModal,
		removeNotice,
		setConnectSource,
		setKeyringResult,
		setReconnectingAccount,
	] );
}

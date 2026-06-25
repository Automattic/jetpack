import { globalNoticesStore } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import { broadcastConnectionCreated, startServiceConnect } from '../../utils';

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
 * (`?connect=<service>&source=editor` → auto-start the redirect, or open the add-account grid for
 * input-first services) and the return (`?connect_return=1` → fetch the keyring result once,
 * complete an in-place reconnect or open confirmation in the grid). Restores reconnect context from
 * `reconnect_id` and strips params so a reload can't re-fire it. Mount once, high in the admin tree.
 */
export function useConnectReturnHandler() {
	const hasRun = useRef( false );

	const {
		fetchKeyringResult,
		setKeyringResult,
		openAddAccountModal,
		completeReconnect,
		setReconnectingAccount,
		setConnectSource,
		setPreselectService,
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

			// Pure-OAuth auto-redirects; input-first (or not-yet-loaded) services finish in the grid.
			if ( service?.url && ! NEEDS_INPUT_SERVICE_IDS.has( intentService ) ) {
				startServiceConnect( service.url, intentService, { source: 'editor' } );
			} else {
				// The grid's ConnectForm will carry source=editor through to the result.
				setConnectSource( 'editor' );
				setPreselectService( intentService );
				openAddAccountModal();
			}

			return;
		}

		// Editor intent: reconnect an existing connection.
		const reconnectIntentId = params.get( 'reconnect' );

		if ( reconnectIntentId ) {
			if ( params.get( 'source' ) !== 'editor' ) {
				return;
			}

			hasRun.current = true;

			const cleanUrl = new URL( window.location.href );
			[ 'reconnect', 'source' ].forEach( key => cleanUrl.searchParams.delete( key ) );
			window.history.replaceState( {}, '', cleanUrl.toString() );

			const connection = getConnectionById( reconnectIntentId );

			if ( ! connection ) {
				openAddAccountModal();
				return;
			}

			setReconnectingAccount( connection );

			const service = getService( connection.service_name );
			const reconnectOptions = {
				source: 'editor' as const,
				refresh: true,
				reconnectId: reconnectIntentId,
			};

			if ( connection.service_name === 'bluesky' ) {
				// Bluesky needs a fresh app password — finish in the grid.
				setConnectSource( 'editor' );
				setPreselectService( 'bluesky' );
				openAddAccountModal();
			} else if ( service?.url && connection.service_name === 'mastodon' ) {
				startServiceConnect( service.url, 'mastodon', {
					...reconnectOptions,
					postFields: { instance: connection.external_handle },
				} );
			} else if ( service?.url ) {
				startServiceConnect( service.url, connection.service_name, reconnectOptions );
			} else {
				openAddAccountModal();
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

				// An editor-opened reconnect completes here (no confirmation step), so it must
				// signal the editor and self-close itself.
				if ( handled && source === 'editor' ) {
					broadcastConnectionCreated( data?.service ?? service, reconnectId ?? '' );
					window.close();
				}

				if ( ! handled ) {
					if ( data?.ID ) {
						setKeyringResult( data );
						openAddAccountModal();
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
		openAddAccountModal,
		removeNotice,
		setConnectSource,
		setKeyringResult,
		setPreselectService,
		setReconnectingAccount,
	] );
}

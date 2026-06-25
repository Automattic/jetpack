import { globalNoticesStore } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import { broadcastConnectionCreated } from '../../utils';
import { useConnectService } from '../use-connect-service';

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

	const { getConnectionById } = useSelect( select => select( socialStore ), [] );

	const connectService = useConnectService();

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

			// Pure-OAuth services redirect straight to auth (fetching the connect URL if it isn't
			// loaded yet); input-first services finish in the grid's credential form.
			if ( ! NEEDS_INPUT_SERVICE_IDS.has( intentService ) ) {
				connectService( intentService, { source: 'editor' } );
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
			} else if ( connection.service_name === 'mastodon' ) {
				connectService( 'mastodon', {
					...reconnectOptions,
					postFields: { instance: connection.external_handle },
				} );
			} else {
				connectService( connection.service_name, reconnectOptions );
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
		connectService,
		createErrorNotice,
		createInfoNotice,
		fetchKeyringResult,
		getConnectionById,
		openAddAccountModal,
		removeNotice,
		setConnectSource,
		setKeyringResult,
		setPreselectService,
		setReconnectingAccount,
	] );
}

import { globalNoticesStore } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import { subscribeToConnectionEvents } from '../../utils';

// Clear a stuck "Connecting…" state if no broadcast ever arrives (abandoned/blocked tab).
const CONNECTING_TIMEOUT_MS = 3 * 60 * 1000;

const connectingNoticeId = ( connectionId: string ) => `publicize-connecting-${ connectionId }`;

/**
 * In the editor, listen for a connection created in the admin tab opened from here. The broadcast
 * fires when the connection is made on the admin side, but it isn't in this tab's list yet — so we
 * refresh the list and show a "Connecting…" notice, then announce "<Service> account connected."
 * only once the connection actually appears here. Mount once at the editor level.
 */
export function useConnectionCreatedListener() {
	const { refreshConnectionTestResults, setConnectingService, closeAddAccountModal } =
		useDispatch( socialStore );

	const { createSuccessNotice, createInfoNotice, removeNotice } = useDispatch( globalNoticesStore );

	const getService = useSelect( select => select( socialStore ).getService, [] );

	const connections = useSelect( select => select( socialStore ).getConnections(), [] );

	const connectingService = useSelect( select => select( socialStore ).getConnectingService(), [] );

	// connectionId -> { service, timer } for connections announced over the channel but not yet listed.
	const pendingRef = useRef(
		new Map< string, { service: string; timer: ReturnType< typeof setTimeout > } >()
	);

	// Once a pending connection shows up in the refreshed list, swap the "Connecting…" notice for the
	// named success notice.
	useEffect( () => {
		if ( ! pendingRef.current.size ) {
			return;
		}

		for ( const [ connectionId, pending ] of pendingRef.current ) {
			const hasLanded = connections.some(
				connection => String( connection.connection_id ) === String( connectionId )
			);

			if ( ! hasLanded ) {
				continue;
			}

			clearTimeout( pending.timer );
			pendingRef.current.delete( connectionId );
			removeNotice( connectingNoticeId( connectionId ) );

			const label = getService( pending.service )?.label || pending.service;
			createSuccessNotice(
				sprintf(
					/* translators: %s is the social network name, e.g. "Bluesky". */
					__( '%s account connected.', 'jetpack-publicize-pkg' ),
					label
				),
				{ type: 'snackbar', isDismissible: true }
			);
		}
	}, [ connections, createSuccessNotice, getService, removeNotice ] );

	useEffect( () => {
		const pending = pendingRef.current;

		const unsubscribe = subscribeToConnectionEvents( {
			onCreated: ( { service, connectionId } ) => {
				// Close the picker and drop the busy card; the named success notice waits until the
				// connection lands in this tab's list (see the effect above).
				setConnectingService( undefined );
				closeAddAccountModal();

				const timer = setTimeout( () => {
					pending.delete( connectionId );
					removeNotice( connectingNoticeId( connectionId ) );
				}, CONNECTING_TIMEOUT_MS );

				pending.set( connectionId, { service, timer } );

				createInfoNotice( __( 'Connecting your account…', 'jetpack-publicize-pkg' ), {
					id: connectingNoticeId( connectionId ),
					type: 'snackbar',
				} );

				refreshConnectionTestResults();
			},
			// The admin tab was dismissed without connecting — just drop the "Connecting…" state.
			onCancelled: () => setConnectingService( undefined ),
		} );

		return () => {
			unsubscribe();
			pending.forEach( entry => clearTimeout( entry.timer ) );
			pending.clear();
		};
	}, [
		closeAddAccountModal,
		createInfoNotice,
		refreshConnectionTestResults,
		removeNotice,
		setConnectingService,
	] );

	useEffect( () => {
		if ( ! connectingService ) {
			return;
		}

		const timer = setTimeout( () => setConnectingService( undefined ), CONNECTING_TIMEOUT_MS );

		return () => clearTimeout( timer );
	}, [ connectingService, setConnectingService ] );
}

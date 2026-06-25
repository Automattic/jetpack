import { globalNoticesStore } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import { subscribeToConnectionCreated } from '../../utils';

// Clear a stuck "Connecting…" state if no broadcast ever arrives (abandoned/blocked tab).
const CONNECTING_TIMEOUT_MS = 3 * 60 * 1000;

/**
 * In the editor, listen for a connection created in the admin tab opened from here, then refresh
 * the connection list and close the modal. Mount once at the editor level so a broadcast is never
 * missed.
 */
export function useConnectionCreatedListener() {
	const { refreshConnectionTestResults, closeConnectionsModal, setConnectingService } =
		useDispatch( socialStore );

	const { createSuccessNotice } = useDispatch( globalNoticesStore );

	const connectingService = useSelect( select => select( socialStore ).getConnectingService(), [] );

	useEffect(
		() =>
			subscribeToConnectionCreated( () => {
				setConnectingService( undefined );
				refreshConnectionTestResults();
				closeConnectionsModal();
				createSuccessNotice( __( 'Social account connected.', 'jetpack-publicize-pkg' ), {
					type: 'snackbar',
					isDismissible: true,
				} );
			} ),
		[
			closeConnectionsModal,
			createSuccessNotice,
			refreshConnectionTestResults,
			setConnectingService,
		]
	);

	useEffect( () => {
		if ( ! connectingService ) {
			return;
		}

		const timer = setTimeout( () => setConnectingService( undefined ), CONNECTING_TIMEOUT_MS );

		return () => clearTimeout( timer );
	}, [ connectingService, setConnectingService ] );
}

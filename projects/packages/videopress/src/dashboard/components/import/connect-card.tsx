import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, EmptyState } from '@wordpress/ui';

/** Window features for the OAuth connect popup. */
const POPUP_FEATURES = 'width=600,height=720,menubar=no,toolbar=no,location=yes,status=no';

/** Milliseconds between checks for the connect popup having been closed. */
export const POPUP_WATCH_INTERVAL_MS = 500;

type Props = {
	/** OAuth URL to open in a popup; null when the backend supplies none. */
	connectUrl: string | null;
	/**
	 * Signals that a connect popup is open (true) or has closed (false), so
	 * the parent can poll the connection query only while the user might be
	 * completing the OAuth flow.
	 */
	onPollingChange: ( polling: boolean ) => void;
	/** Re-fetch the connection state (e.g. right after the popup closes). */
	refetch: () => void;
};

/**
 * Empty-state card prompting the user to connect their YouTube account.
 *
 * Clicking the CTA opens the OAuth URL in a popup and watches for it to
 * close; while it is open the parent is told to poll the connection query so
 * the stage flips to the picker as soon as the flow completes. In mock mode
 * the connection is instantly connected and this card never renders — the
 * branch exists for the real WPCOM Keyring flow. When no connect URL is
 * available the CTA falls back to re-fetching the connection state.
 *
 * @param props                 - Component props.
 * @param props.connectUrl      - OAuth URL to open in a popup; null when absent.
 * @param props.onPollingChange - Signals popup-open (true) / closed (false).
 * @param props.refetch         - Re-fetch the connection state.
 * @return The connect card element.
 */
export default function ConnectCard( { connectUrl, onPollingChange, refetch }: Props ) {
	const watchTimerRef = useRef< number | null >( null );

	// Stop watching (and polling) if the card unmounts mid-flow — e.g. the
	// connection flipped to connected while the popup was still open.
	// onPollingChange is a useState setter upstream, so this effect runs its
	// cleanup on unmount only.
	useEffect( () => {
		return () => {
			if ( watchTimerRef.current !== null ) {
				window.clearInterval( watchTimerRef.current );
				watchTimerRef.current = null;
			}
			onPollingChange( false );
		};
	}, [ onPollingChange ] );

	const onConnect = () => {
		if ( ! connectUrl ) {
			// No OAuth URL to open (mock mode edge, or a transient backend
			// gap): the best we can do is ask the server again.
			refetch();
			return;
		}

		const popup = window.open( connectUrl, 'videopress-youtube-connect', POPUP_FEATURES );
		if ( ! popup ) {
			// Popup blocked; leave the flag alone and let the user retry.
			return;
		}

		onPollingChange( true );
		watchTimerRef.current = window.setInterval( () => {
			if ( popup.closed ) {
				if ( watchTimerRef.current !== null ) {
					window.clearInterval( watchTimerRef.current );
					watchTimerRef.current = null;
				}
				onPollingChange( false );
				// One last check in case the flow finished just as it closed.
				refetch();
			}
		}, POPUP_WATCH_INTERVAL_MS );
	};

	return (
		<div className="vp-import__connect">
			<EmptyState.Root>
				<EmptyState.Title>
					{ __( 'Connect your YouTube account', 'jetpack-videopress-pkg' ) }
				</EmptyState.Title>
				<EmptyState.Description>
					{ __(
						'Import your videos’ titles, descriptions, and thumbnails from YouTube. You can attach each video file afterwards.',
						'jetpack-videopress-pkg'
					) }
				</EmptyState.Description>
				<EmptyState.Actions>
					<Button onClick={ onConnect }>
						{ __( 'Connect YouTube account', 'jetpack-videopress-pkg' ) }
					</Button>
				</EmptyState.Actions>
			</EmptyState.Root>
		</div>
	);
}

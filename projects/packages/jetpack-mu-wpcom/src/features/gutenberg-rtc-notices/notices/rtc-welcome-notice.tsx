/**
 * RTC Welcome Notice
 *
 * One-time dismissible notice shown when users first enter the editor
 * on sites with real-time collaboration enabled. Dismissed per-site per-user.
 *
 * Title: "Edit posts together, in real time"
 * Body: Explains RTC feature and invites feedback via support.
 * CTA: "Start editing together"
 */

import apiFetch from '@wordpress/api-fetch';
import { useSelect } from '@wordpress/data';
import { useState, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { isRoomLimitBreached } from '../room-limit';
import RtcNoticeModal from '../rtc-notice-modal';

// Wait before showing the welcome notice to give the sync connection
// time to establish and potentially hit the room limit first.
const WELCOME_NOTICE_DELAY_MS = 6000;

interface SyncConnectionStatus {
	status: string;
}

const RtcWelcomeNotice = () => {
	const config = window.wpcomRtcNotices;

	const [ isDismissed, setIsDismissed ] = useState( config?.welcomeDismissed ?? true );
	const [ isReady, setIsReady ] = useState( false );

	// Delay showing the notice to avoid flashing it before a limit disconnect.
	useEffect( () => {
		const timeout = setTimeout( () => setIsReady( true ), WELCOME_NOTICE_DELAY_MS );
		return () => clearTimeout( timeout );
	}, [] );

	// Don't show the welcome notice if the sync connection is lost (e.g. room
	// limit reached). The limit-reached modal should take priority.
	// Also detect when Gutenberg's own "Welcome to the editor" guide is visible —
	// that means the user has never opened the editor before, so the RTC notice
	// is irrelevant (it announces a feature to returning users).
	const { isDisconnected, isWelcomeGuideVisible } = useSelect( select => {
		const coreStore = select( 'core' ) as {
			getSyncConnectionStatus?: () => SyncConnectionStatus | undefined;
		};
		const prefs = select( 'core/preferences' ) as
			| { get: ( scope: string, key: string ) => unknown }
			| undefined;
		return {
			isDisconnected:
				coreStore.getSyncConnectionStatus?.()?.status === 'disconnected' || isRoomLimitBreached(),
			isWelcomeGuideVisible: !! prefs?.get( 'core/edit-post', 'welcomeGuide' ),
		};
	}, [] );

	const dismissNotice = useCallback( () => {
		setIsDismissed( true );
		apiFetch( {
			path: '/wpcom/v2/rtc-notices/dismiss',
			method: 'POST',
		} ).catch( () => {
			// Silently fail - the notice will show again next time if the API call fails.
		} );
	}, [] );

	// Auto-dismiss the RTC welcome notice for first-time editor users so it
	// won't appear after they close Gutenberg's own "Welcome to the editor" guide.
	useEffect( () => {
		if ( isWelcomeGuideVisible && ! isDismissed ) {
			dismissNotice();
		}
	}, [ isWelcomeGuideVisible, isDismissed, dismissNotice ] );

	if ( ! config || isDismissed || ! isReady || isDisconnected ) {
		return null;
	}

	return (
		<RtcNoticeModal
			isOpen={ ! isDismissed }
			title={ __( 'Edit posts together, in real time', 'jetpack-mu-wpcom' ) }
			description={ __(
				"You can now edit posts with others at the same time. See each other's changes instantly, right in the WordPress editor. Have fun, and if you have questions or feedback reach out to our support team.",
				'jetpack-mu-wpcom'
			) }
			primaryAction={ {
				label: __( 'Start editing together', 'jetpack-mu-wpcom' ),
				onClick: dismissNotice,
			} }
			onRequestClose={ dismissNotice }
			className="rtc-notice-modal--welcome"
		/>
	);
};

export default RtcWelcomeNotice;

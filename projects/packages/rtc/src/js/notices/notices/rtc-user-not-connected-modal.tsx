/**
 * RTC User Not Connected Modal
 *
 * Shown when the current user's account is not linked to WordPress.com and
 * therefore cannot authenticate with the PingHub WebSocket server. Listens
 * for the `wpcom-rtc-user-not-connected` window event dispatched by the
 * PingHub bridge when the token endpoint returns a 403 `user_not_connected`
 * error.
 *
 * Also exports `registerUserNotConnectedFilter` which suppresses Gutenberg's
 * default "Connection lost" modal (editor.SyncConnectionErrorModal) whenever
 * this error is detected, preventing a double-modal situation.
 */

import { useEffect, useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import RtcNoticeModal from '../rtc-notice-modal';
import type { FC } from 'react';

/**
 * Module-level flag — set to true the first time the
 * `wpcom-rtc-user-not-connected` event fires so that the
 * editor.SyncConnectionErrorModal filter can read it synchronously
 * at render time (the event always precedes the disconnection notice).
 */
let userNotConnectedReceived = false;
window.addEventListener( 'wpcom-rtc-user-not-connected', () => {
	userNotConnectedReceived = true;
} );

/**
 * Register a filter that suppresses Gutenberg's built-in "Connection lost"
 * modal when the user-not-connected error has been detected. Our own
 * RtcUserNotConnectedModal (rendered via the plugin) handles the prompt.
 */
export function registerUserNotConnectedFilter(): void {
	addFilter(
		'editor.SyncConnectionErrorModal',
		'jetpack/rtc-user-not-connected',
		( OriginalComponent: FC ) => ( props: Record< string, unknown > ) => {
			if ( userNotConnectedReceived ) {
				return null;
			}
			return <OriginalComponent { ...props } />;
		}
	);
}

const RtcUserNotConnectedModal = () => {
	const [ isOpen, setIsOpen ] = useState( false );
	const config = window.jetpackRtcNotices;

	useEffect( () => {
		const handler = () => setIsOpen( true );
		window.addEventListener( 'wpcom-rtc-user-not-connected', handler );
		return () => window.removeEventListener( 'wpcom-rtc-user-not-connected', handler );
	}, [] );

	if ( ! isOpen || ! config?.connectUserUrl ) {
		return null;
	}

	return (
		<RtcNoticeModal
			isOpen={ isOpen }
			title={ __( 'Link your WordPress.com account', 'jetpack-rtc' ) }
			description={ __(
				'Real-time collaboration requires your account to be linked to WordPress.com.',
				'jetpack-rtc'
			) }
			primaryAction={ {
				label: __( 'Link account with WordPress.com', 'jetpack-rtc' ),
				onClick: () => {
					window.location.href = config.connectUserUrl;
				},
			} }
			secondaryAction={ {
				label: __( 'Back to posts', 'jetpack-rtc' ),
				onClick: () => {
					window.location.href = config.postsListUrl;
				},
			} }
			onRequestClose={ () => {} }
			isDismissible={ false }
			shouldCloseOnClickOutside={ false }
		/>
	);
};

export default RtcUserNotConnectedModal;

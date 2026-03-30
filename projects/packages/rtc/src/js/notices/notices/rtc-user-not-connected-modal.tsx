/**
 * RTC User Not Connected Modal
 *
 * Shown when the current user's account is not linked to WordPress.com and
 * therefore cannot authenticate with the PingHub WebSocket server. Listens
 * for the `wpcom-rtc-user-not-connected` window event dispatched by the
 * PingHub bridge when the token endpoint returns a 403 `user_not_connected`
 * error.
 */

import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import RtcNoticeModal from '../rtc-notice-modal';

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
			title={ __( 'Link your WordPress.com account', 'jetpack-mu-wpcom' ) }
			description={ __(
				'Real-time collaboration requires your account to be linked to WordPress.com.',
				'jetpack-mu-wpcom'
			) }
			primaryAction={ {
				label: __( 'Link account with WordPress.com', 'jetpack-mu-wpcom' ),
				onClick: () => {
					window.location.href = config.connectUserUrl;
				},
			} }
			secondaryAction={ {
				label: __( 'Back to posts', 'jetpack-mu-wpcom' ),
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

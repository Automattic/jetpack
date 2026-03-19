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
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import RtcNoticeModal from '../rtc-notice-modal';

const RtcWelcomeNotice = () => {
	const config = window.wpcomRtcNotices;

	const [ isDismissed, setIsDismissed ] = useState( config?.welcomeDismissed ?? true );

	const dismissNotice = useCallback( () => {
		setIsDismissed( true );
		apiFetch( {
			path: '/wpcom/v2/rtc-notices/dismiss',
			method: 'POST',
		} ).catch( () => {
			// Silently fail - the notice will show again next time if the API call fails.
		} );
	}, [] );

	if ( ! config || isDismissed ) {
		return null;
	}

	return (
		<RtcNoticeModal
			isOpen={ ! isDismissed }
			title={ __( 'Edit posts together, in real time', 'jetpack-mu-wpcom' ) }
			description={ __(
				'You can now edit posts with others at the same time. See each other\u2019s changes instantly, right in the WordPress editor. Have fun, and if you have questions or feedback reach out to our support team.',
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

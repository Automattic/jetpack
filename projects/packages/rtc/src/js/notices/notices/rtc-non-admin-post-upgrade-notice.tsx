/**
 * RTC Non-Admin Post Upgrade Notice
 *
 * Shown to non-admin users after the admin has upgraded the plan
 * and there is now room for more collaborators on a post they
 * were previously blocked from.
 */

import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import RtcNoticeModal from '../rtc-notice-modal';

/**
 * Props passed via a custom event from the RTC sync layer when
 * a non-admin can now join after the admin upgraded.
 */
interface PostUpgradeData {
	postTitle: string;
	postEditUrl: string;
}

const RtcNonAdminPostUpgradeNotice = () => {
	const config = window.jetpackRtcNotices;
	const [ noticeData, setNoticeData ] = useState< PostUpgradeData | null >( null );

	// Listen for a custom event dispatched by the RTC sync layer.
	useEffect( () => {
		const handler = ( event: CustomEvent< PostUpgradeData > ) => {
			if ( config && ! config.isAdmin ) {
				setNoticeData( event.detail );
			}
		};
		window.addEventListener( 'wpcom-rtc-post-upgrade', handler as EventListener );
		return () => {
			window.removeEventListener( 'wpcom-rtc-post-upgrade', handler as EventListener );
		};
	}, [ config ] );

	const handleClose = useCallback( () => setNoticeData( null ), [] );

	if ( ! noticeData || config?.isAdmin ) {
		return null;
	}

	const description = sprintf(
		/* translators: %s: post title */
		__(
			'Your admin made room for more editors. Head back to “%s” and pick up where you left off.',
			'jetpack-rtc'
		),
		noticeData.postTitle
	);

	const ctaLabel = sprintf(
		/* translators: %s: post title */
		__( 'Edit “%s”', 'jetpack-rtc' ),
		noticeData.postTitle
	);

	return (
		<RtcNoticeModal
			isOpen={ true }
			title={ __( 'Let the collaboration begin', 'jetpack-rtc' ) }
			description={ description }
			primaryAction={ {
				label: ctaLabel,
				onClick: () => {
					window.location.href = noticeData.postEditUrl;
				},
			} }
			onRequestClose={ handleClose }
			className="rtc-notice-modal--non-admin-post-upgrade"
		/>
	);
};

export default RtcNonAdminPostUpgradeNotice;

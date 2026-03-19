/**
 * RTC Connection Error Modal Filter
 *
 * Replaces Gutenberg's default `SyncConnectionErrorModal` with a branded
 * WP.com RTC notice using the `editor.SyncConnectionErrorModal` filter
 * (added in Gutenberg PR #76554).
 *
 * Detects limit-related disconnections via:
 * 1. The `connection-limit-exceeded` error code (from Gutenberg's built-in check).
 * 2. The `isRoomLimitBreached()` flag (from our room-limit.ts wrapper).
 *
 * For non-admin users hitting the limit, also records a join request
 * so the admin can be notified.
 */

import apiFetch from '@wordpress/api-fetch';
import { useRef } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { isRoomLimitBreached } from '../room-limit';
import RtcNoticeModal from '../rtc-notice-modal';
import type { FC } from 'react';

interface SyncConnectionErrorModalProps {
	description: string;
	error?: { code?: string };
	manualRetry?: () => void;
	postType?: { slug?: string; labels?: { name?: string } } | null;
	secondsRemainingUntilAutoRetry?: number;
	title: string;
}

const WpcomSyncConnectionErrorModal: FC< SyncConnectionErrorModalProps > = () => {
	const config = window.wpcomRtcNotices;
	const joinRequestSent = useRef( false );

	if ( ! config ) {
		return null;
	}

	// Non-admin: record a join request so the admin gets notified.
	if ( ! config.isAdmin && config.postId && ! joinRequestSent.current ) {
		joinRequestSent.current = true;
		apiFetch( {
			path: '/wpcom/v2/rtc-notices/join-request',
			method: 'POST',
			data: { post_id: config.postId },
		} ).catch( () => {} );
	}

	const isAdmin = config.isAdmin;

	const title = isAdmin
		? __( 'Allow your team to collaborate', 'jetpack-mu-wpcom' )
		: __( 'You can\u2019t edit this together yet', 'jetpack-mu-wpcom' );

	const description = isAdmin
		? __(
				'Your plan\u2019s collaborator limit has been reached. No room for anyone else right now.',
				'jetpack-mu-wpcom'
		  )
		: __(
				'Your team is already editing this post and the collaborator limit has been reached. We\u2019ve notified your admin so they can make room.',
				'jetpack-mu-wpcom'
		  );

	const siteSlug = config.siteSlug || '';
	const upgradeUrl = `https://wordpress.com/setup/plan-upgrade/plans?${ new URLSearchParams( {
		siteSlug,
		feature: 'wpcom-ws-rtc',
		cancel_to: `https://wordpress.com/post/${ siteSlug }/${ config.postId }`,
	} ).toString() }`;

	const primaryAction = isAdmin
		? {
				label: __( 'Upgrade to invite your entire team', 'jetpack-mu-wpcom' ),
				onClick: () => {
					window.location.href = upgradeUrl;
				},
		  }
		: {
				label: __( 'Back to posts', 'jetpack-mu-wpcom' ),
				onClick: () => {
					window.location.href = config.postsListUrl;
				},
		  };

	const secondaryAction = isAdmin
		? {
				label: __( 'Back to posts', 'jetpack-mu-wpcom' ),
				onClick: () => {
					window.location.href = config.postsListUrl;
				},
		  }
		: undefined;

	return (
		<RtcNoticeModal
			isOpen={ true }
			title={ title }
			description={ description }
			primaryAction={ primaryAction }
			secondaryAction={ secondaryAction }
			onRequestClose={ () => {} }
			isDismissible={ false }
			shouldCloseOnClickOutside={ false }
			className="rtc-notice-modal--limit-reached"
		/>
	);
};

/**
 * Register the filter to replace Gutenberg's default sync connection error modal.
 */
export function registerConnectionErrorModalFilter(): void {
	addFilter(
		'editor.SyncConnectionErrorModal',
		'wpcom/rtc-connection-error-modal',
		( OriginalComponent: FC< SyncConnectionErrorModalProps > ) =>
			( props: SyncConnectionErrorModalProps ) => {
				const isLimitError =
					props.error?.code === 'connection-limit-exceeded' || isRoomLimitBreached();

				if ( isLimitError ) {
					return <WpcomSyncConnectionErrorModal { ...props } />;
				}

				return <OriginalComponent { ...props } />;
			}
	);
}

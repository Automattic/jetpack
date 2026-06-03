/**
 * RTC Admin Someone Waiting Notice
 *
 * Polls for pending join requests from non-admin users who were blocked
 * by the collaborator limit. Shows a dismissible notice to the admin
 * with the waiting user's name.
 *
 * Title: "Someone's waiting to join"
 * CTA: "Upgrade to invite your entire team"
 */

import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import RtcNoticeModal from '../rtc-notice-modal';

interface JoinRequest {
	userName: string;
	userId: number;
	time: number;
}

const POLL_INTERVAL = 5000;

const RtcAdminSomeoneWaitingNotice = () => {
	const config = window.jetpackRtcNotices;
	const [ waitingUser, setWaitingUser ] = useState< JoinRequest | null >( null );
	const dismissed = useRef( false );

	const pollForRequests = useCallback( () => {
		if ( ! config?.isPlanOwner || ! config.postId || dismissed.current ) {
			return;
		}

		apiFetch< { requests: JoinRequest[] } >( {
			path: `/wpcom/v2/rtc-notices/join-requests?post_id=${ config.postId }`,
		} )
			.then( response => {
				if ( response.requests.length > 0 && ! dismissed.current ) {
					setWaitingUser( response.requests[ 0 ] );
				}
			} )
			.catch( () => {} );
	}, [ config ] );

	useEffect( () => {
		if ( ! config?.isPlanOwner || ! config.postId ) {
			return;
		}

		const interval = setInterval( pollForRequests, POLL_INTERVAL );
		return () => clearInterval( interval );
	}, [ config, pollForRequests ] );

	const handleDismiss = useCallback( () => {
		dismissed.current = true;
		setWaitingUser( null );

		if ( config?.postId ) {
			apiFetch( {
				path: '/wpcom/v2/rtc-notices/join-requests/clear',
				method: 'POST',
				data: { post_id: config.postId },
			} ).catch( () => {} );
		}
	}, [ config ] );

	if ( ! waitingUser || ! config?.isPlanOwner ) {
		return null;
	}

	const description = sprintf(
		/* translators: 1: user name, 2: post title */
		__(
			"%1$s wants to join “%2$s” while your team is already working on it, but you've hit your plan's collaborator limit.",
			'jetpack-rtc'
		),
		waitingUser.userName,
		config.postTitle
	);

	return (
		<RtcNoticeModal
			isOpen={ true }
			title={ __( "Someone's waiting to join", 'jetpack-rtc' ) }
			description={ description }
			primaryAction={ {
				label: __( 'Upgrade to invite your entire team', 'jetpack-rtc' ),
				onClick: () => {
					const slug = config.siteSlug || '';
					const upgradeUrl = `https://wordpress.com/setup/plan-upgrade/plans?${ new URLSearchParams(
						{
							siteSlug: slug,
							feature: 'wpcom-ws-rtc',
							cancel_to: `https://wordpress.com/post/${ slug }/${ config.postId }`,
						}
					).toString() }`;
					window.location.href = upgradeUrl;
				},
			} }
			onRequestClose={ handleDismiss }
			className="rtc-notice-modal--someone-waiting"
		/>
	);
};

export default RtcAdminSomeoneWaitingNotice;

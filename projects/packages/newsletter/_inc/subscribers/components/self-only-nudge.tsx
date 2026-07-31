import { ActionPopover } from '@automattic/jetpack-components';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getBlogId } from '../lib/site';
import { recordTracksEvent } from '../lib/tracks';

/**
 * Per-blog so dismissing on one site doesn't silence the nudge on another.
 *
 * @return localStorage key for the dismissal flag.
 */
function dismissalKey(): string {
	return `jetpack-newsletter-self-only-nudge-dismissed-${ getBlogId() ?? 'unknown' }`;
}

/**
 * Read the dismissal flag. Wrapped because localStorage throws outright in private-mode Safari and
 * when storage is disabled by policy — a nudge is never worth breaking the page over.
 *
 * @return True when this viewer already dismissed the nudge on this site.
 */
function wasDismissed(): boolean {
	try {
		return window.localStorage.getItem( dismissalKey() ) === '1';
	} catch {
		return false;
	}
}

type Props = {
	anchor: Element | null;
	onAddSubscribers: () => void;
};

/**
 * Points a creator at the "Add subscribers" button when their own subscription is the only one on
 * the site. Anchored to the header button rather than rendered in the table, so it costs the list
 * no vertical space.
 *
 * The condition is self-limiting — it stops matching the moment anyone else subscribes — so the
 * stored dismissal only has to cover the viewer who genuinely stays at one subscriber.
 *
 * @param props                  - Component props.
 * @param props.anchor           - Element to attach the popover to (the header button).
 * @param props.onAddSubscribers - Opens the Add Subscribers modal.
 * @return Popover, or null once dismissed / before the anchor mounts.
 */
export default function SelfOnlyNudge( { anchor, onAddSubscribers }: Props ): JSX.Element | null {
	const [ dismissed, setDismissed ] = useState( wasDismissed );
	const visible = !! anchor && ! dismissed;

	useEffect( () => {
		if ( visible ) {
			recordTracksEvent( 'jetpack_subscribers_self_only_nudge_displayed' );
		}
	}, [ visible ] );

	const dismiss = useCallback( () => {
		try {
			window.localStorage.setItem( dismissalKey(), '1' );
		} catch {
			// Dismissal just won't persist across reloads.
		}
		setDismissed( true );
	}, [] );

	const handleClick = useCallback( () => {
		recordTracksEvent( 'jetpack_subscribers_self_only_nudge_clicked' );
		dismiss();
		onAddSubscribers();
	}, [ dismiss, onAddSubscribers ] );

	const handleClose = useCallback( () => {
		recordTracksEvent( 'jetpack_subscribers_self_only_nudge_dismissed' );
		dismiss();
	}, [ dismiss ] );

	if ( ! visible ) {
		return null;
	}

	return (
		<ActionPopover
			anchor={ anchor }
			title={ __( 'You’re your only subscriber', 'jetpack-newsletter' ) }
			buttonContent={ __( 'Add subscribers', 'jetpack-newsletter' ) }
			onClick={ handleClick }
			onClose={ handleClose }
			noArrow={ false }
			position="bottom left"
		>
			{ __( 'Invite readers by email to grow your newsletter.', 'jetpack-newsletter' ) }
		</ActionPopover>
	);
}

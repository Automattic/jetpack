import { Popover } from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { IconButton, Stack, Text } from '@wordpress/ui';
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
};

/**
 * Points a creator at the "Add subscribers" button when their own subscription is the only one on
 * the site. Anchored beside the button rather than rendered in the table, so it costs the list no
 * vertical space, and it carries no CTA of its own — the button it points at is the CTA.
 *
 * The condition is self-limiting — it stops matching the moment anyone else subscribes — so the
 * stored dismissal only has to cover the viewer who genuinely stays at one subscriber.
 *
 * @param props        - Component props.
 * @param props.anchor - Element to sit beside (the header button).
 * @return Popover, or null once dismissed / before the anchor mounts.
 */
export default function SelfOnlyNudge( { anchor }: Props ): JSX.Element | null {
	const [ dismissed, setDismissed ] = useState( wasDismissed );
	const visible = !! anchor && ! dismissed;

	useEffect( () => {
		if ( visible ) {
			recordTracksEvent( 'jetpack_subscribers_self_only_nudge_displayed' );
		}
	}, [ visible ] );

	const handleClose = useCallback( () => {
		try {
			window.localStorage.setItem( dismissalKey(), '1' );
		} catch {
			// Dismissal just won't persist across reloads.
		}
		recordTracksEvent( 'jetpack_subscribers_self_only_nudge_dismissed' );
		setDismissed( true );
	}, [] );

	if ( ! visible ) {
		return null;
	}

	return (
		<Popover
			anchor={ anchor }
			placement="left"
			offset={ 8 }
			noArrow={ false }
			// Nobody asked for this popover, so it must not take the caret on arrival.
			focusOnMount={ false }
			onClose={ handleClose }
			className="jetpack-newsletter-self-only-nudge"
		>
			<Stack direction="row" align="top" gap="sm">
				<Stack direction="column" gap="xs">
					<Text variant="heading-sm">
						{ __( 'Every newsletter starts at one', 'jetpack-newsletter' ) }
					</Text>
					<Text variant="body-sm">
						{ __(
							'Yours is no exception. Add a few people who already know you — friends, family, coworkers — and they’ll get your next post.',
							'jetpack-newsletter'
						) }
					</Text>
				</Stack>
				<IconButton
					icon={ close }
					label={ __( 'Dismiss', 'jetpack-newsletter' ) }
					size="small"
					variant="minimal"
					onClick={ handleClose }
				/>
			</Stack>
		</Popover>
	);
}

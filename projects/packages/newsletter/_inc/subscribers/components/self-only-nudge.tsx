import { Popover } from '@wordpress/components';
import { createInterpolateElement, useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { IconButton, Stack, Text } from '@wordpress/ui';
import { getBlogId } from '../lib/site';
import { recordTracksEvent } from '../lib/tracks';

/**
 * localStorage key for the dismissal flag, scoped per blog.
 *
 * @return Storage key.
 */
function dismissalKey(): string {
	return `jetpack-newsletter-self-only-nudge-dismissed-${ getBlogId() ?? 'unknown' }`;
}

/**
 * Read the dismissal flag. localStorage throws in private-mode Safari and when disabled by policy.
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
 * the site.
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
			// Storage unavailable.
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
			placement="left-start"
			offset={ 8 }
			noArrow={ false }
			resize={ false }
			flip={ false }
			shift
			focusOnMount={ false }
			onClose={ handleClose }
			className="jetpack-newsletter-self-only-nudge"
		>
			<Stack direction="row" align="flex-start" justify="space-between" gap="sm">
				<Stack direction="column" gap="sm">
					<Text variant="heading-lg">
						{ __( 'Every newsletter starts at one', 'jetpack-newsletter' ) }
					</Text>
					<Text variant="body-sm">
						{ createInterpolateElement(
							__(
								'Yours is no exception. Add a few people who already know you: <who>friends, family, coworkers</who>.',
								'jetpack-newsletter'
							),
							{ who: <em /> }
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

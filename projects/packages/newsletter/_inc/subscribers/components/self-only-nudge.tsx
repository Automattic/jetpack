import { Popover } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __, isRTL } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';

type Props = {
	anchor: HTMLElement | null;
	onDismiss: () => void;
};

/**
 * Points a creator at the "Add subscribers" button when their own subscription is the only one on
 * the site. Waits to be acknowledged rather than closing itself, so it can't vanish before it has
 * been read.
 *
 * @param props           - Component props.
 * @param props.anchor    - Element to sit beside (the header button).
 * @param props.onDismiss - Called when the viewer closes the nudge; the caller owns the state so
 *                        dismissing sticks across the remounts a search or filter causes.
 * @return Popover, or null before the anchor mounts.
 */
export default function SelfOnlyNudge( { anchor, onDismiss }: Props ): JSX.Element | null {
	// No room beside the button once wp-admin goes mobile, so drop it under the button instead.
	const isNarrow = useViewportMatch( 'medium', '<' );

	// Dismissing unmounts the bubble, which would strand focus on `document.body` when it was the
	// "Got it" button that just went away. Hand it to the anchor instead. `focusOnMount={ false }`
	// also switches off `Popover`'s own focus return, so this is the only thing moving focus here.
	const handleDismiss = useCallback( () => {
		onDismiss();
		anchor?.focus();
	}, [ anchor, onDismiss ] );

	if ( ! anchor ) {
		return null;
	}

	// `left`/`right` are physical, so mirror them to keep the bubble on the inline-start side.
	const inlineStartPlacement = isRTL() ? 'right-start' : 'left-start';

	return (
		<Popover
			anchor={ anchor }
			placement={ isNarrow ? 'bottom-end' : inlineStartPlacement }
			offset={ 8 }
			noArrow={ false }
			// Default `resize` shrinks the bubble to the room above the anchor, down to a scrolling sliver.
			resize={ false }
			// The bubble arrives on its own whenever the subscribers query resolves, so it must not
			// pull focus off whatever the viewer is already doing. `role="status"` announces it
			// where it stands instead, and "Got it" is how it goes away.
			focusOnMount={ false }
			onClose={ handleDismiss }
			role="status"
			className="jetpack-newsletter-self-only-nudge"
		>
			<Stack direction="column" align="flex-start" gap="sm">
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
				<Button size="compact" variant="minimal" tone="neutral" onClick={ handleDismiss }>
					{ __( 'Got it', 'jetpack-newsletter' ) }
				</Button>
			</Stack>
		</Popover>
	);
}

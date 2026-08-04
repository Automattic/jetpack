import { Popover } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { createInterpolateElement, useCallback, useId } from '@wordpress/element';
import { __, isRTL } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';

type Props = {
	anchor: HTMLElement | null;
	onDismiss: () => void;
};

/**
 * Points a creator at the "Add subscribers" button when their own subscription is the only one on
 * the site. Takes focus as it appears and closes the moment focus leaves, so it carries no dismiss
 * control of its own — anything the viewer does next is the dismissal.
 *
 * @param props           - Component props.
 * @param props.anchor    - Element to sit beside (the header button).
 * @param props.onDismiss - Called when the viewer closes the nudge; the caller owns the state so
 *                        dismissing sticks across the remounts a search or filter causes, and so
 *                        the bubble can't reappear and grab focus a second time.
 * @return Popover, or null before the anchor mounts.
 */
export default function SelfOnlyNudge( { anchor, onDismiss }: Props ): JSX.Element | null {
	// No room beside the button once wp-admin goes mobile, so drop it under the button instead.
	const isNarrow = useViewportMatch( 'medium', '<' );
	const titleId = useId();
	const bodyId = useId();

	// Escape fires while focus is still on the bubble, so unmounting drops focus to `document.body`.
	// Hand it back to the anchor. Focus moving out needs no such help — it has already landed
	// somewhere deliberate, which is why `onFocusOutside` is wired straight to `onDismiss`.
	const handleEscape = useCallback( () => {
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
			// Focus the bubble itself (nothing inside is tabbable) so assistive tech reads it out and
			// the next click or Tab dismisses it. `constrainTabbing` defaults to on whenever
			// `focusOnMount` is set, which would trap the very Tab meant to dismiss this.
			focusOnMount
			constrainTabbing={ false }
			onClose={ handleEscape }
			onFocusOutside={ onDismiss }
			// Nothing announces a bubble that appears on its own and portals to the end of `<body>`,
			// so name it and describe it for the focus landing.
			role="note"
			aria-labelledby={ titleId }
			aria-describedby={ bodyId }
			className="jetpack-newsletter-self-only-nudge"
		>
			<Stack direction="column" gap="sm">
				<Text id={ titleId } variant="heading-lg">
					{ __( 'Every newsletter starts at one', 'jetpack-newsletter' ) }
				</Text>
				<Text id={ bodyId } variant="body-sm">
					{ createInterpolateElement(
						__(
							'Yours is no exception. Add a few people who already know you: <who>friends, family, coworkers</who>.',
							'jetpack-newsletter'
						),
						{ who: <em /> }
					) }
				</Text>
			</Stack>
		</Popover>
	);
}

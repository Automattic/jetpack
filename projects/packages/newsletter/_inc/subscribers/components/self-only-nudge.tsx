import { Popover } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __, _x, isRTL } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import './self-only-nudge.scss';

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
	const isNarrow = useViewportMatch( 'medium', '<' );

	const handleDismiss = useCallback( () => {
		onDismiss();
		anchor?.focus();
	}, [ anchor, onDismiss ] );

	if ( ! anchor ) {
		return null;
	}

	const inlineStartPlacement = isRTL() ? 'right-start' : 'left-start';

	return (
		<Popover
			anchor={ anchor }
			placement={ isNarrow ? 'bottom-end' : inlineStartPlacement }
			offset={ 8 }
			noArrow={ false }
			resize={ false }
			focusOnMount={ false }
			onClose={ handleDismiss }
			onFocusOutside={ onDismiss }
			role="status"
			className="jetpack-newsletter-self-only-nudge"
		>
			<Stack
				className="jetpack-newsletter-self-only-nudge__body"
				direction="column"
				align="flex-start"
				gap="sm"
			>
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
				<Button size="compact" variant="outline" tone="neutral" onClick={ handleDismiss }>
					{ _x( 'Got it', 'dismiss button', 'jetpack-newsletter' ) }
				</Button>
			</Stack>
		</Popover>
	);
}

import { Popover } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { createInterpolateElement, useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { IconButton, Stack, Text } from '@wordpress/ui';

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
	const [ dismissed, setDismissed ] = useState( false );
	// No room beside the button once wp-admin goes mobile, so drop it under the button instead.
	const isNarrow = useViewportMatch( 'medium', '<' );
	const handleClose = useCallback( () => setDismissed( true ), [] );

	if ( ! anchor || dismissed ) {
		return null;
	}

	return (
		<Popover
			anchor={ anchor }
			placement={ isNarrow ? 'bottom-end' : 'left-start' }
			offset={ 8 }
			noArrow={ false }
			// Default `resize` shrinks the bubble to the room above the anchor, down to a scrolling sliver.
			resize={ false }
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

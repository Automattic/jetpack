import { __, sprintf } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
import { Button, Popover, VisuallyHidden } from '@wordpress/ui';
import { useCallback } from 'react';
import useAnalytics from '../../../hooks/use-analytics';
import type { FC, ReactElement } from 'react';

interface InfoPopoverProps {
	/** What the popover explains, e.g. "Auto-Firewall"; names the trigger for assistive tech. */
	label: string;
	title: ReactElement | string;
	text: ReactElement | string;
	tracksEventProps?: Record< Lowercase< string >, unknown >;
	/** Replaces the default info icon button, e.g. to show a threat count beside the icon. */
	trigger?: ReactElement;
}

export const InfoPopover: FC< InfoPopoverProps > = ( {
	label,
	title,
	text,
	tracksEventProps = {},
	trigger,
} ) => {
	const { recordEvent } = useAnalytics();

	const onOpenChange = useCallback(
		( open: boolean ) => {
			if ( open ) {
				recordEvent( 'jetpack_protect_card_tooltip_open', {
					page: 'my-jetpack',
					feature: 'jetpack-protect',
					...tracksEventProps,
				} );
			}
		},
		[ recordEvent, tracksEventProps ]
	);

	return (
		<Popover.Root onOpenChange={ onOpenChange }>
			<Popover.Trigger
				render={
					trigger ?? (
						// Button rather than IconButton, which adds a hover tooltip on top of the popover.
						<Button
							variant="unstyled"
							className="protect-info-popover__trigger"
							aria-label={ sprintf(
								/* translators: %s is the name of a Protect feature, e.g. "Auto-Firewall". */
								__( 'More about %s', 'jetpack-my-jetpack' ),
								label
							) }
						>
							<Button.Icon icon={ info } />
						</Button>
					)
				}
			/>
			<Popover.Popup className="protect-info-popover">
				{ /* Hidden but kept: the popup is aria-labelledby its Title. */ }
				<VisuallyHidden render={ <Popover.Title /> }>{ title }</VisuallyHidden>
				<Popover.Description>{ text }</Popover.Description>
			</Popover.Popup>
		</Popover.Root>
	);
};

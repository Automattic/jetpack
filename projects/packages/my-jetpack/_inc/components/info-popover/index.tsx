import { __, sprintf } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
import { Button, Popover, VisuallyHidden } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback } from 'react';
import useAnalytics from '../../hooks/use-analytics';
import type { FC, ReactElement, ReactNode } from 'react';

import './style.scss';

export interface InfoPopoverProps {
	/** What the popover explains, e.g. "Auto-Firewall"; names the trigger for assistive tech. */
	label: string;
	title: ReactNode;
	text: ReactNode;
	className?: string;
	/** Recorded as `jetpack_<tracksEventName>` each time the popover opens. */
	tracksEventName?: string;
	tracksEventProps?: Record< Lowercase< string >, unknown >;
	/** Replaces the default info icon button, e.g. to show a count beside the icon. */
	trigger?: ReactElement;
}

export const InfoPopover: FC< InfoPopoverProps > = ( {
	label,
	title,
	text,
	className,
	tracksEventName,
	tracksEventProps = {},
	trigger,
} ) => {
	const { recordEvent } = useAnalytics();

	const onOpenChange = useCallback(
		( open: boolean ) => {
			if ( open && tracksEventName ) {
				recordEvent( `jetpack_${ tracksEventName }`, {
					page: 'my-jetpack',
					...tracksEventProps,
				} );
			}
		},
		[ recordEvent, tracksEventName, tracksEventProps ]
	);

	return (
		<Popover.Root onOpenChange={ onOpenChange }>
			<Popover.Trigger
				render={
					trigger ?? (
						// Button rather than IconButton, which adds a hover tooltip on top of the popover.
						<Button
							variant="unstyled"
							className="my-jetpack-info-popover__trigger"
							aria-label={ sprintf(
								/* translators: %s is the name of the feature or stat the popover explains, e.g. "Auto-Firewall". */
								__( 'More about %s', 'jetpack-my-jetpack' ),
								label
							) }
						>
							<Button.Icon icon={ info } />
						</Button>
					)
				}
			/>
			<Popover.Popup className={ clsx( 'my-jetpack-info-popover', className ) }>
				{ /* Hidden but kept: the popup is aria-labelledby its Title. */ }
				<VisuallyHidden render={ <Popover.Title /> }>{ title }</VisuallyHidden>
				<Popover.Description>{ text }</Popover.Description>
			</Popover.Popup>
		</Popover.Root>
	);
};

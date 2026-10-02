import { __, sprintf } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
import { Icon, Popover, VisuallyHidden } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback } from 'react';
import useAnalytics from '../../hooks/use-analytics';
import type { FC, ReactNode } from 'react';

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
	/** Replaces the trigger's default accessible name, "More about <label>". */
	triggerLabel?: string;
	/** Shown beside the info icon, e.g. a count. */
	triggerContent?: ReactNode;
	critical?: boolean;
}

export const InfoPopover: FC< InfoPopoverProps > = ( {
	label,
	title,
	text,
	className,
	tracksEventName,
	tracksEventProps = {},
	triggerLabel,
	triggerContent,
	critical = false,
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
				openOnHover
				delay={ 200 }
				closeDelay={ 200 }
				className={ clsx( 'my-jetpack-info-popover__trigger', {
					'my-jetpack-info-popover__trigger--critical': critical,
				} ) }
				aria-label={
					triggerLabel ??
					sprintf(
						/* translators: %s is the name of the feature or stat the popover explains, e.g. "Auto-Firewall". */
						__( 'More about %s', 'jetpack-my-jetpack' ),
						label
					)
				}
			>
				<Icon icon={ info } size={ 20 } />
				{ triggerContent }
			</Popover.Trigger>
			<Popover.Popup className={ clsx( 'my-jetpack-info-popover', className ) }>
				{ /* Hidden but kept: the popup is aria-labelledby its Title. */ }
				<VisuallyHidden render={ <Popover.Title /> }>{ title }</VisuallyHidden>
				<Popover.Description>{ text }</Popover.Description>
			</Popover.Popup>
		</Popover.Root>
	);
};

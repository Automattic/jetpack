import { InfoPopover } from '../../info-popover';
import type { InfoPopoverProps } from '../../info-popover';
import type { FC } from 'react';

export const ProtectInfoPopover: FC< Omit< InfoPopoverProps, 'tracksEventName' > > = ( {
	tracksEventProps,
	...props
} ) => (
	<InfoPopover
		tracksEventName="protect_card_tooltip_open"
		tracksEventProps={ { feature: 'jetpack-protect', ...tracksEventProps } }
		{ ...props }
	/>
);

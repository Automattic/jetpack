import { __ } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
import { Icon, Popover } from '@wordpress/ui';
import clsx from 'clsx';
import type { ReactNode } from 'react';

type Props = {
	label?: string;
	side?: 'top' | 'right' | 'bottom' | 'left';
	className?: string;
	children: ReactNode;
};

/**
 * An info icon that shows extra detail in a popover on hover or click.
 *
 * @param props           - Props.
 * @param props.label     - Accessible name for the trigger.
 * @param props.side      - Which side of the trigger the popover opens on.
 * @param props.className - Extra class for the trigger.
 * @param props.children  - Popover content.
 * @return The info popover.
 */
export default function DetailsInfoPopover( {
	label = __( 'More information', 'jetpack-blaze' ),
	side = 'bottom',
	className,
	children,
}: Props ) {
	return (
		<Popover.Root>
			<Popover.Trigger
				openOnHover
				delay={ 200 }
				closeDelay={ 200 }
				className={ clsx( 'campaign-item-details__info-popover-trigger', className ) }
				aria-label={ label }
			>
				<Icon icon={ info } size={ 18 } />
			</Popover.Trigger>
			<Popover.Popup
				className="campaign-item-details__info-popover"
				positioner={ <Popover.Positioner side={ side } /> }
			>
				{ children }
			</Popover.Popup>
		</Popover.Root>
	);
}

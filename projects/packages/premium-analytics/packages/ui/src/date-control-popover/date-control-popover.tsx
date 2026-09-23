/**
 * External dependencies
 */
import { Popover, Tooltip, VisuallyHidden } from '@jetpack-premium-analytics/externals';
import type { ReactElement, ReactNode } from 'react';
/**
 * Internal dependencies
 */
import './date-control-popover.scss';

type DateControlPopoverProps = {
	/** The button that opens the menu. */
	trigger: ReactElement;

	/** Names the popup for assistive tech; not drawn. */
	title: string;

	/** Shown over the trigger on hover and focus; nothing is shown without it. */
	tooltip?: ReactNode;

	/** Which edge of the trigger the menu lines up with. */
	align: 'start' | 'end';

	open: boolean;

	onOpenChange: ( open: boolean ) => void;

	children: ReactNode;
};

/**
 * A date control's menu surface. It is a `@wordpress/ui` Popover so it stacks
 * with the `@wordpress/ui` overlays it can open from, such as a widget's
 * collapsed controls (WordPress/gutenberg#83442).
 */
export function DateControlPopover( {
	trigger,
	title,
	tooltip,
	align,
	open,
	onOpenChange,
	children,
}: DateControlPopoverProps ) {
	const popoverTrigger = <Popover.Trigger render={ trigger } />;

	return (
		<Popover.Root open={ open } onOpenChange={ onOpenChange }>
			{ tooltip ? (
				<Tooltip.Root>
					<Tooltip.Trigger render={ popoverTrigger } />
					<Tooltip.Popup>{ tooltip }</Tooltip.Popup>
				</Tooltip.Root>
			) : (
				popoverTrigger
			) }
			<Popover.Popup
				className="date-control-popover"
				positioner={ <Popover.Positioner side="bottom" align={ align } /> }
			>
				<VisuallyHidden render={ <Popover.Title /> }>{ title }</VisuallyHidden>
				{ children }
			</Popover.Popup>
		</Popover.Root>
	);
}

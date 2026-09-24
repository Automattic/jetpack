/**
 * External dependencies
 */
import { Popover, Tooltip, VisuallyHidden } from '@jetpack-premium-analytics/externals';
import {
	useId,
	type AriaAttributes,
	type KeyboardEventHandler,
	type MouseEventHandler,
	type ReactElement,
	type ReactNode,
} from 'react';
/**
 * Internal dependencies
 */
import './date-control-popover.scss';

type DateControlPopoverProps = {
	/** The button that opens the menu. Must forward onClick/onKeyDown/aria-* props, since Popover.Trigger clones them onto it. */
	trigger: ReactElement< {
		onClick?: MouseEventHandler;
		onKeyDown?: KeyboardEventHandler;
		'aria-haspopup'?: AriaAttributes[ 'aria-haspopup' ];
	} >;

	/** Names the popup for assistive tech; not drawn. */
	title: string;

	/** Shown over the trigger on hover and focus, and read as its description; nothing is shown without it. */
	tooltip?: string;

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
	const descriptionId = useId();

	return (
		<Popover.Root open={ open } onOpenChange={ onOpenChange }>
			{ /* Disabled rather than left out, so the trigger keeps its node as the tooltip comes and goes. */ }
			<Tooltip.Root disabled={ ! tooltip }>
				<Tooltip.Trigger
					// The ui Tooltip describes nothing, so the text is also wired up as a description.
					aria-describedby={ tooltip ? descriptionId : undefined }
					render={ <Popover.Trigger render={ trigger } /> }
				/>
				<Tooltip.Popup>{ tooltip }</Tooltip.Popup>
			</Tooltip.Root>
			{ tooltip && <VisuallyHidden id={ descriptionId }>{ tooltip }</VisuallyHidden> }
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

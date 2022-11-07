export type Placement = 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end';

export type Position =
	| 'top left'
	| 'top center'
	| 'top right'
	| 'bottom left'
	| 'bottom center'
	| 'bottom right';

export type IconTooltipProps = {
	/**
	 * The wrapper class name of this IconTooltip component.
	 */
	className?: string;

	/**
	 * The class name applied to Gridicon.
	 */
	iconClassName?: string;

	/**
	 * The deprecated position of Popover.
	 */
	position?: Position;

	/**
	 * The placement of Popover.
	 */
	placement?: Placement;

	/**
	 * The animation for Popover appears.
	 */
	animate?: boolean;

	/**
	 * The icon code for Gridicon.
	 */
	iconCode?: string;

	/**
	 * The title of Popover.
	 */
	title?: string;

	/**
	 * The main body content of Popover.
	 */
	children?: React.ReactNode;

	/**
	 * The icon square width and height size (in px) also calculate the Popover shift.
	 */
	iconSize?: number;

	/**
	 * The distance (in px) between the anchor and the Popover.
	 */
	offset?: number;

	/**
	 * Set the Popover anchor for its alignment with placement.
	 */
	popoverAnchorStyle?: 'icon' | 'wrapper';

	/**
	 * Force the Popover to show without an event trigger.
	 */
	forceShow?: boolean;
};

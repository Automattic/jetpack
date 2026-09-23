import type { Icon } from '@wordpress/icons';
import type { ComponentProps, ReactNode } from 'react';

export type Placement = 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end';

export type Position =
	'top left' | 'top center' | 'top right' | 'bottom left' | 'bottom center' | 'bottom right';

export type IconTooltipProps = {
	/**
	 * The wrapper class name of this IconTooltip component.
	 */
	className?: string;
	/**
	 * The class name applied to the Popover, which is outside the wrapper when not inline.
	 */
	popoverClassName?: string;

	/**
	 * The class name applied to the icon.
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
	 * The icon to display. Accepts icon components from `@wordpress/icons`.
	 */
	iconCode?: ComponentProps< typeof Icon >[ 'icon' ];

	/**
	 * The title of Popover.
	 */
	title?: string;

	/**
	 * The main body content of Popover.
	 */
	children?: ReactNode;

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
	 * Text to render as the trigger in place of the icon. The component owns the open state.
	 */
	trigger?: ReactNode;

	/**
	 * Called on every press of the trigger, e.g. to record analytics.
	 */
	onTriggerClick?: () => void;

	/**
	 * Whether a press outside the trigger and popover closes the tooltip. Turn it off for a
	 * reference the visitor keeps open while working elsewhere on the page.
	 */
	closeOnClickOutside?: boolean;

	/**
	 * Force the Popover to show without an event trigger. Only for a wrapper-anchored
	 * tooltip with no `trigger`, such as a programmatic tour step.
	 */
	forceShow?: boolean;

	/**
	 * Enables the Popover to show on hover.
	 */
	hoverShow?: boolean;

	/**
	 * Uses a wider content area when enabled. Has no effect when `inline` is false: it widens the
	 * wrapper element the popover leaves behind, so a portalled popover needs its own width.
	 */
	wide?: boolean;

	/**
	 * Whether to render the popover inline or as a portal.
	 */
	inline?: boolean;

	/**
	 * Enables the Popover to shift in order to stay in view when meeting the viewport edges.
	 */
	shift?: boolean;
};

/**
 * External dependencies
 */
import type { Button } from '@jetpack-premium-analytics/externals';
import type { ComponentProps, KeyboardEvent } from 'react';

/**
 * How a date control draws its trigger: the Button's own look, which the
 * surface the control sits on can adjust, e.g. a compact widget header.
 */
export type DateControlTriggerProps = Pick<
	ComponentProps< typeof Button >,
	'variant' | 'tone' | 'size' | 'className' | 'style'
>;

/** A bordered neutral box, so every trigger on a row reads as one control set. */
export const DATE_CONTROL_TRIGGER_DEFAULTS = {
	variant: 'outline',
	tone: 'neutral',
} as const satisfies DateControlTriggerProps;

/**
 * Opens a closed menu on ArrowDown, the shortcut `DropdownMenu` gave these
 * triggers. A disabled trigger stays focusable, so it has to refuse it here.
 *
 * @param state          - The trigger's menu state.
 * @param state.isOpen   - Whether the menu is open.
 * @param state.onToggle - Opens or closes the menu.
 * @param state.disabled - Whether the trigger is disabled.
 * @return The trigger's keydown handler.
 */
export function openOnArrowDown( {
	isOpen,
	onToggle,
	disabled,
}: {
	isOpen: boolean;
	onToggle: () => void;
	disabled: boolean;
} ) {
	return ( event: KeyboardEvent ) => {
		if ( ! disabled && ! isOpen && event.code === 'ArrowDown' ) {
			event.preventDefault();
			onToggle();
		}
	};
}

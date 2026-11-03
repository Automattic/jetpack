export type ArrowStep = 'previous' | 'next';

type ArrowEvent = Pick<
	KeyboardEvent,
	'key' | 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'target' | 'defaultPrevented'
>;

/**
 * The arrow key that steps one way, following reading direction: left is previous in LTR and next in RTL.
 *
 * @param step - The way to step.
 * @param rtl  - Whether the locale reads right to left.
 * @return The key that steps that way.
 */
export function getStepKey( step: ArrowStep, rtl: boolean ): 'ArrowLeft' | 'ArrowRight' {
	return ( step === 'previous' ) !== rtl ? 'ArrowLeft' : 'ArrowRight';
}

/**
 * Which way an arrow key should step through the feature list.
 *
 * @param event - The keydown to interpret.
 * @param rtl   - Whether the locale reads right to left.
 * @return The direction to step, or null when the key is not ours to take.
 */
export function getArrowStep( event: ArrowEvent, rtl: boolean ): ArrowStep | null {
	if ( event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' ) {
		return null;
	}

	// A shortcut of its own, or a key something else already handled: leave it be.
	if (
		event.defaultPrevented ||
		event.altKey ||
		event.ctrlKey ||
		event.metaKey ||
		event.shiftKey
	) {
		return null;
	}

	// Fields and arrow-key widgets get the arrows first; there they move a caret or a selection.
	if (
		( event.target as HTMLElement | null )?.closest?.(
			'input, textarea, select, [contenteditable="true"], [role="menu"], [role="listbox"], [role="radiogroup"], [role="tablist"], [role="slider"]'
		)
	) {
		return null;
	}

	return event.key === getStepKey( 'previous', rtl ) ? 'previous' : 'next';
}

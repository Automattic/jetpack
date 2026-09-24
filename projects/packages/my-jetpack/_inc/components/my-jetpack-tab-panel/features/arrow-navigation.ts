export type ArrowStep = 'previous' | 'next';

type ArrowEvent = Pick<
	KeyboardEvent,
	'key' | 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'target' | 'defaultPrevented'
>;

/**
 * Which way an arrow key should step through the feature list.
 *
 * Left means previous in LTR and next in RTL, following reading direction.
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

	const back = event.key === 'ArrowLeft' ? ! rtl : rtl;

	return back ? 'previous' : 'next';
}

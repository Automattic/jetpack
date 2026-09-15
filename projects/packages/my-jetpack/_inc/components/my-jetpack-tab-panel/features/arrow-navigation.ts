export type ArrowStep = 'previous' | 'next';

type ArrowEvent = Pick<
	KeyboardEvent,
	'key' | 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'target'
>;

/**
 * Which way an arrow key should step through the feature list.
 *
 * The arrows follow the chevrons, so they swap with them in RTL.
 *
 * @param event - The keydown to interpret.
 * @param rtl   - Whether the locale reads right to left.
 * @return The direction to step, or null when the key is not ours to take.
 */
export function getArrowStep( event: ArrowEvent, rtl: boolean ): ArrowStep | null {
	if ( event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' ) {
		return null;
	}

	// A shortcut of its own: leave it to the browser.
	if ( event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ) {
		return null;
	}

	// A field gets the arrows first — there they move a caret or a selection.
	if (
		( event.target as HTMLElement | null )?.closest?.(
			'input, textarea, select, [contenteditable="true"]'
		)
	) {
		return null;
	}

	const back = event.key === 'ArrowLeft' ? ! rtl : rtl;

	return back ? 'previous' : 'next';
}

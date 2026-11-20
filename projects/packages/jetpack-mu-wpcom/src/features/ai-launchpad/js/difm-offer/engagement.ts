/**
 * Hover and text-select engagement tracking for the DIFM offer banner, ported from Calypso's
 * `use-difm-offer-engagement-tracking.ts`. The rules are the same, so one query covers every
 * surface: a 500 ms dwell, a 300 ms selection debounce, and at most one event of each kind per
 * mount. The selected text is never sent, only its length.
 *
 * Free of DOM and React so the rules can be tested in Node. The banner wires the handlers to
 * its element and to `document`.
 */

export const HOVER_EVENT = 'calypso_difm_offer_banner_hover';
export const TEXT_SELECT_EVENT = 'calypso_difm_offer_banner_text_select';

// A pointer that only crosses the banner on its way somewhere else is not interest.
export const HOVER_DELAY_MS = 500;
// A drag fires many selection changes. Wait for the user to stop before reading the selection.
export const SELECTION_DEBOUNCE_MS = 300;

/**
 * The `selection_length` to record for the parts of a selection that fall inside the banner.
 *
 * @param insideTexts - The selected text of each range, already clipped to the banner.
 * @return The character count, or 0 when nothing but whitespace is selected.
 */
export function selectionLength( insideTexts: string[] ): number {
	const text = insideTexts.join( '' );
	return text.trim() ? text.length : 0;
}

export interface EngagementTimers {
	setTimeout: ( callback: () => void, ms: number ) => unknown;
	clearTimeout: ( handle: unknown ) => void;
}

export interface EngagementTrackerOptions {
	// Records one event. `extra` holds the event's own props on top of the banner's base props.
	record: ( eventName: string, extra?: { selection_length: number } ) => void;
	// The current `selection_length` inside the banner, read when the selection settles.
	measureSelection: () => number;
	timers?: EngagementTimers;
}

export interface EngagementTracker {
	pointerEnter: () => void;
	pointerLeave: () => void;
	selectionChange: () => void;
	// Clears the running timers, so an unmounted banner records nothing more.
	dispose: () => void;
}

/**
 * Creates the engagement tracker for one mount of the banner.
 *
 * @param options                  - Tracker options.
 * @param options.record           - Records one event.
 * @param options.measureSelection - Reads the selection length inside the banner.
 * @param options.timers           - The timer functions. Defaults to the global ones.
 * @return The handlers to attach, and `dispose` for unmount.
 */
export function createEngagementTracker( {
	record,
	measureSelection,
	timers = globalThis,
}: EngagementTrackerOptions ): EngagementTracker {
	let hoverTimer: unknown;
	let selectionTimer: unknown;
	let hasRecordedHover = false;
	let hasRecordedTextSelect = false;
	let isDisposed = false;

	return {
		pointerEnter() {
			if ( hasRecordedHover || isDisposed ) {
				return;
			}
			timers.clearTimeout( hoverTimer );
			hoverTimer = timers.setTimeout( () => {
				hasRecordedHover = true;
				record( HOVER_EVENT );
			}, HOVER_DELAY_MS );
		},

		pointerLeave() {
			timers.clearTimeout( hoverTimer );
		},

		selectionChange() {
			if ( hasRecordedTextSelect || isDisposed ) {
				return;
			}
			timers.clearTimeout( selectionTimer );
			selectionTimer = timers.setTimeout( () => {
				const length = measureSelection();
				if ( ! length ) {
					return;
				}
				hasRecordedTextSelect = true;
				record( TEXT_SELECT_EVENT, { selection_length: length } );
			}, SELECTION_DEBOUNCE_MS );
		},

		dispose() {
			isDisposed = true;
			timers.clearTimeout( hoverTimer );
			timers.clearTimeout( selectionTimer );
		},
	};
}

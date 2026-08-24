/**
 * How the date-range presets render for the width they have been given.
 *
 * Measured rather than compared against a breakpoint: the same row needs 470px
 * in English and 694px in Russian, so any hardcoded boundary is wrong for some
 * language. See WOOA7S-1817 for the measurements.
 *
 * Abbreviated is the last step. A row too narrow even for that keeps its pills
 * rather than hiding the whole choice behind a menu.
 */
export type PresetLabelMode =
	/** Full labels ("7 days"), while they fit. */
	| 'full'
	/** Abbreviated labels ("7D") once they do not. */
	| 'abbreviated';

/**
 * Longest label form that fits the width available.
 *
 * Falls back to `full` until the measurement is in; a wrong guess corrects on
 * the next frame. The boundary is inclusive.
 *
 * The row is every control, not just the presets: the custom-range trigger and
 * the comparison control share the width, and only the presets have a shorter
 * form to give back.
 */
export function resolvePresetLabelMode(
	availableWidth: number | null,
	fullRowWidth: number | null
): PresetLabelMode {
	if ( availableWidth === null || fullRowWidth === null ) {
		return 'full';
	}

	return availableWidth >= fullRowWidth ? 'full' : 'abbreviated';
}

/**
 * Threshold width (in pixels) for showing two months in the custom-range calendar.
 *
 * Unlike the preset labels, this one stays a constant: the calendar's content is
 * two month grids whose width does not follow the locale's string lengths.
 */
export const WIDE_CALENDAR_CONTAINER_THRESHOLD = 560;

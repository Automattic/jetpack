/**
 * How the date-range presets render for the width they have been given.
 *
 * Picked by measuring the group's own content rather than comparing the
 * container against fixed breakpoints: the same row needs 470px in English and
 * 694px in Russian, so any hardcoded boundary is wrong for some language. See
 * WOOA7S-1817 for the measurements.
 *
 * The presets always render as pills. A row too narrow even for the
 * abbreviated form keeps them: collapsing the surface into a select hid the
 * whole choice behind a menu for the sake of a width that the section header
 * now answers by stacking.
 */
export type PresetLabelMode =
	/** Full labels ("Last 7 days"), while they fit. */
	| 'full'
	/** Abbreviated labels ("7D") once they do not. */
	| 'abbreviated';

/**
 * Longest label form that fits the width available.
 *
 * Falls back to `full` until the measurement is in: it is what the panel showed
 * before any of this existed, and a wrong guess corrects on the next frame. The
 * boundary is inclusive, so a row that exactly fills the width counts as
 * fitting.
 *
 * The row is the whole set of controls, not just the presets: the custom-range
 * trigger and the comparison control share the width, and only the presets have
 * a shorter form to give back when it runs out.
 *
 * @param availableWidth - Measured width of the panel, or null before first measure.
 * @param fullRowWidth   - Natural width of the row in full labels, or null before first measure.
 * @return The label form to render.
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

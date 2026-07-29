/**
 * How the date-range presets render for the width they have been given.
 *
 * Picked by measuring the group's own content rather than comparing the
 * container against fixed breakpoints: the same row needs 470px in English and
 * 694px in Russian, so any hardcoded boundary is wrong for some language. See
 * WOOA7S-1817 for the measurements.
 */
export type PresetLabelMode =
	/** Full labels ("Last 7 days"), while they fit. */
	| 'full'
	/** Abbreviated labels ("7D"), while those fit. */
	| 'abbreviated'
	/** A select, once even the abbreviated pills do not fit. */
	| 'select';

/**
 * Natural width of the preset row in each label form, in CSS pixels.
 */
export type PresetRowWidths = {
	full: number;
	abbreviated: number;
};

/**
 * Longest label form that fits the width available.
 *
 * Falls back to `full` until both measurements are in: it is what the panel
 * showed before any of this existed, and a wrong guess corrects on the next
 * frame. Boundaries are inclusive, so a form that exactly fills the row counts
 * as fitting.
 *
 * @param availableWidth - Measured width of the panel, or null before first measure.
 * @param rowWidths      - Natural widths from the probe, or null before first measure.
 * @return The label form to render.
 */
export function resolvePresetLabelMode(
	availableWidth: number | null,
	rowWidths: PresetRowWidths | null
): PresetLabelMode {
	if ( availableWidth === null || rowWidths === null ) {
		return 'full';
	}

	if ( availableWidth >= rowWidths.full ) {
		return 'full';
	}

	return availableWidth >= rowWidths.abbreviated ? 'abbreviated' : 'select';
}

/**
 * Threshold width (in pixels) for showing two months in the custom-range calendar.
 *
 * Unlike the preset labels, this one stays a constant: the calendar's content is
 * two month grids whose width does not follow the locale's string lengths.
 */
export const WIDE_CALENDAR_CONTAINER_THRESHOLD = 560;

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
 * Threshold width (in pixels) below which preset controls collapse to a select.
 *
 * @deprecated Superseded by the measured `PresetLabelMode`. Still read while the
 * remaining consumers migrate.
 */
export const MOBILE_CONTAINER_WIDTH_THRESHOLD = 600;

/**
 * Threshold width (in pixels) for showing two months in the custom-range calendar.
 *
 * Unlike the preset labels, this one stays a constant: the calendar's content is
 * two month grids whose width does not follow the locale's string lengths.
 */
export const WIDE_CALENDAR_CONTAINER_THRESHOLD = 560;

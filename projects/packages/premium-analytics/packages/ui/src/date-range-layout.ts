/**
 * How the date-range presets render for the given width. Measured, not a
 * breakpoint: the same row needs 470px in English, 694px in Russian — see
 * WOOA7S-1817. Abbreviated is the last step; a too-narrow row keeps its pills.
 */
export type PresetLabelMode =
	/** Full labels ("7 days"), while they fit. */
	| 'full'
	/** Abbreviated labels ("7D") once they do not. */
	| 'abbreviated';

/**
 * Longest label form that fits the width available. Falls back to `full`
 * until measured (a wrong guess corrects next frame; boundary inclusive).
 * The row is every control, not just presets — only presets have a shorter form.
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

/**
 * Viewport width (in pixels) at which the period menu can seat two month grids
 * beside its list: the list's own column plus the calendar's wide threshold.
 *
 * Read from the viewport rather than a container, since the menu floats in a
 * popover and is bounded by the window rather than by the row it opens from.
 */
export const WIDE_PERIOD_MENU_THRESHOLD = 820;

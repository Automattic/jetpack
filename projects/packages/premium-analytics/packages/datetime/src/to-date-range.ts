/**
 * External dependencies
 */
import { TZDate } from '@date-fns/tz';
import { endOfDay, endOfMonth } from 'date-fns';
/**
 * Internal dependencies
 */
import { PRESET_LAST_12_MONTHS, type PrimaryPresetId } from './presets/types';
import type { DateRange } from './get-comparison-range';

/**
 * The window a to-date preset covers once its running month completes.
 *
 * `last-12-months` runs from the first of a month to the end of today, so
 * measuring it reports the shape of today's date rather than of the
 * selection: 354 days mid-month, 12 months on the last day of one. Anything
 * that describes or moves the window in whole units — its length, the step
 * arrows, the previous period — measures this window instead. What the reader
 * sees stays the range as selected.
 *
 * Every other preset comes back untouched. A hand-picked range that happens
 * to start on the first has no running month to complete, so it is measured
 * as read.
 *
 * `endOfMonth` keeps a `TZDate` in its zone, so the completed end closes the
 * month on the site's clock.
 *
 * @param range    - The range the preset produced.
 * @param presetId - The preset that produced it.
 * @return The completed window, or `range` itself for any other preset.
 */
export function completeToDateRange< T extends DateRange >(
	range: T,
	presetId?: PrimaryPresetId
): T {
	if ( presetId !== PRESET_LAST_12_MONTHS || ! range.to ) {
		return range;
	}

	return { ...range, to: endOfMonth( range.to ) };
}

/**
 * Pull a window's end back to the end of today when it runs past it.
 *
 * A window measured in whole months or years may step forward into the month
 * or year in progress, which `canStepForward` counts as reachable so the
 * window a reader stepped back from stays reachable. The step itself lands on
 * the end of that unit, days the report has no data for and the chart would
 * draw as empty buckets. Stepping forward out of "12 months" therefore returns
 * the to-date window the reader started from.
 *
 * @param range - The window to clamp.
 * @param now   - The current instant.
 * @return The clamped window, or `range` itself when it already ends today or earlier.
 */
export function clampRangeEndToToday< T extends DateRange >( range: T, now: Date ): T {
	if ( ! range.to ) {
		return range;
	}

	// Anchored to the window's own timezone, so a site offset from the browser
	// closes the day on its own clock.
	const timeZone = 'timeZone' in range.to ? ( range.to as TZDate ).timeZone : undefined;
	const endOfToday = endOfDay( timeZone ? new TZDate( now.getTime(), timeZone ) : now );

	return range.to.getTime() > endOfToday.getTime() ? { ...range, to: endOfToday } : range;
}

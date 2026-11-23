/**
 * External dependencies
 */
import { endOfMonth, endOfYear } from 'date-fns';
/**
 * Internal dependencies
 */
import { PRESET_LAST_12_MONTHS, PRESET_LAST_3_YEARS, type PrimaryPresetId } from './presets/types';
import type { DateRange } from './get-comparison-range';

/**
 * The window a to-date preset covers once its running unit completes.
 *
 * `last-12-months` and `last-3-years` both run to the end of today, so
 * measuring one reports the shape of today's date rather than of the
 * selection: 354 days mid-month, 12 months on the last day of one. Anything
 * that describes the window in whole units — its length, the previous
 * period — measures this window instead. What the reader sees stays the range
 * as selected.
 *
 * Every other preset comes back untouched. A hand-picked range that happens
 * to start on the first has no running unit to complete, so it is measured
 * as read.
 *
 * `endOfMonth` and `endOfYear` keep a `TZDate` in its zone, so the completed
 * end closes on the site's clock.
 *
 * @param range    - The range the preset produced.
 * @param presetId - The preset that produced it.
 * @return The completed window, or `range` itself for any other preset.
 */
export function completeToDateRange< T extends DateRange >(
	range: T,
	presetId?: PrimaryPresetId
): T {
	if ( ! range.to ) {
		return range;
	}

	switch ( presetId ) {
		case PRESET_LAST_12_MONTHS:
			return { ...range, to: endOfMonth( range.to ) };
		case PRESET_LAST_3_YEARS:
			return { ...range, to: endOfYear( range.to ) };
		default:
			return range;
	}
}

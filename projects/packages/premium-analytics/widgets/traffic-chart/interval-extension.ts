/**
 * External dependencies
 */
import {
	getAllowedIntervalsForPreset,
	getDaysBetweenInclusive,
	type IntervalExtension,
	type IntervalRange,
} from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { TrafficChartType } from './widget';

/** The longest range, in days, whose every day this chart can draw; a leap year included. */
const DAILY_RANGE_MAX_DAYS = 366;

/**
 * Days on ranges up to a year: a line can draw a year of them, while bars that thin stop being
 * readable, so bars list them withheld. The shared rule drops any the range already offers.
 *
 * @param range     - The range the chart reads.
 * @param chartType - How the chart is drawn.
 * @return What the chart changes about its range's buckets.
 */
export function trafficIntervalExtension(
	range: IntervalRange,
	chartType: TrafficChartType
): IntervalExtension {
	const from = range.from ?? '';
	const to = range.to ?? '';
	const allowed = getAllowedIntervalsForPreset( range.preset, from, to );

	// Hours alone for a day or less, even one spanning two dates (Last 24 hours).
	if ( allowed.includes( 'hour' ) || getDaysBetweenInclusive( from, to ) > DAILY_RANGE_MAX_DAYS ) {
		return {};
	}

	return chartType === 'line'
		? { extra: [ 'day' ] }
		: {
				unavailable: {
					intervals: [ 'day' ],
					hint: __( 'Switch to the line chart to see each day.', 'jetpack-premium-analytics-pkg' ),
				},
			};
}

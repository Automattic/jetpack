/**
 * External dependencies
 */
import type { BucketInfo } from '@jetpack-premium-analytics/externals';
import type { DateFormatName } from '@jetpack-premium-analytics/formatters';

/**
 * How precisely a label must name a point for its bucket size. A date alone
 * names 24 hourly buckets (so identifies none) but a daily one exactly;
 * anything coarser stays date-named since the axis/legend already cover the range.
 */
// Exhaustive on purpose: a new resolution in the library fails to compile here
// rather than falling through to a date silently.
const DATE_FORMAT_FOR_RESOLUTION: Record< BucketInfo[ 'displayResolution' ], DateFormatName > = {
	hour: 'dateTime',
	day: 'medium',
	month: 'medium',
	year: 'medium',
};

/**
 * The named date format a point's label should use at a bucket size.
 *
 * Takes the chart library's own classification rather than the caller's
 * `tickResolution` prop, which is absent on most widgets and left an hourly
 * series labelling all 24 of a day's points with the same date.
 *
 * @param displayResolution - The resolution the library formats this series at.
 * @return The named format.
 */
export function dateFormatForResolution(
	displayResolution: BucketInfo[ 'displayResolution' ]
): DateFormatName {
	return DATE_FORMAT_FOR_RESOLUTION[ displayResolution ];
}

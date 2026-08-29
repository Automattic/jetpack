/**
 * External dependencies
 */
import type { TickResolution } from '@jetpack-premium-analytics/externals';
import type { DateFormatName } from '@jetpack-premium-analytics/formatters';

/**
 * How precisely a label must name a point for its bucket size. A date alone
 * names 24 hourly buckets (so identifies none) but a daily one exactly;
 * anything coarser stays date-named since the axis/legend already cover the range.
 */
const DATE_FORMAT_FOR_RESOLUTION: Partial< Record< TickResolution, DateFormatName > > = {
	hour: 'dateTime',
};

const DEFAULT_DATE_FORMAT: DateFormatName = 'medium';

/**
 * The named date format a point's label should use at a bucket size.
 *
 * @param tickResolution - The bucket size the series was drawn at.
 * @return The named format.
 */
export function dateFormatForResolution( tickResolution?: TickResolution ): DateFormatName {
	return (
		( tickResolution ? DATE_FORMAT_FOR_RESOLUTION[ tickResolution ] : undefined ) ??
		DEFAULT_DATE_FORMAT
	);
}

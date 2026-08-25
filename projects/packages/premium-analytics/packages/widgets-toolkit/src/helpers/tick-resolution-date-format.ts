/**
 * External dependencies
 */
import type { TickResolution } from '@jetpack-premium-analytics/externals';
import type { DateFormatName } from '@jetpack-premium-analytics/formatters';

/**
 * How precisely a label has to name a point for the bucket size it was drawn at.
 *
 * A bucket is identified by the finest field its size varies in: a date alone
 * names 24 hourly buckets and so identifies none of them, while it names a daily
 * one exactly. Anything coarser than a day is still named by its date, since the
 * range covered is what the axis and legend already spell out.
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

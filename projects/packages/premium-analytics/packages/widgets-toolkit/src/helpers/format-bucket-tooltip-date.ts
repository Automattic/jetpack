/**
 * External dependencies
 */
import { localTZDate } from '@jetpack-premium-analytics/datetime';
import { formatDate, formatDateRange } from '@jetpack-premium-analytics/formatters';
import { endOfYear, isSameDay, startOfYear } from 'date-fns';
/**
 * Internal dependencies
 */
import { dateFormatForResolution } from './tick-resolution-date-format';
import type { BucketInfo } from '@jetpack-premium-analytics/externals';

type BucketDatum = { date: Date; realDate?: Date; endDate?: Date };

function isWholeYear( from: Date, to: Date ): boolean {
	return isSameDay( from, startOfYear( from ) ) && isSameDay( to, endOfYear( from ) );
}

/**
 * The date a tooltip row names for a point: the days its own bucket covers when a
 * date-labelled bucket spans several (a week) or the range cuts a year, otherwise
 * the bucket's start.
 *
 * @param datum             - The point; a comparison point's own dates are in `realDate`.
 * @param displayResolution - The resolution the chart labels its buckets at.
 * @return The formatted date or span.
 */
export function formatBucketTooltipDate(
	datum: BucketDatum,
	displayResolution: BucketInfo[ 'displayResolution' ]
): string {
	const start = datum.realDate ?? datum.date;
	const { endDate } = datum;

	if ( endDate ) {
		const range = { from: localTZDate( start ), to: localTZDate( endDate ) };

		if (
			displayResolution === 'day' ||
			( displayResolution === 'year' && ! isWholeYear( range.from, range.to ) )
		) {
			return formatDateRange( range );
		}
	}

	return formatDate( start, dateFormatForResolution( displayResolution ) );
}

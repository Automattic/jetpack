/**
 * External dependencies
 */
import { localTZDate } from '@jetpack-premium-analytics/datetime';
import { formatDate, formatDateRange } from '@jetpack-premium-analytics/formatters';
import { endOfMonth, endOfYear, isSameDay, startOfMonth, startOfYear } from 'date-fns';
/**
 * Internal dependencies
 */
import { dateFormatForResolution } from './tick-resolution-date-format';
import type { BucketInfo } from '@jetpack-premium-analytics/externals';

type BucketDatum = { date: Date; realDate?: Date; endDate?: Date };

function isWholeBucket( resolution: 'month' | 'year', from: Date, to: Date ): boolean {
	return resolution === 'month'
		? isSameDay( from, startOfMonth( from ) ) && isSameDay( to, endOfMonth( from ) )
		: isSameDay( from, startOfYear( from ) ) && isSameDay( to, endOfYear( from ) );
}

/**
 * The date a tooltip row names for a point: the days its own bucket covers when a
 * date-labelled bucket spans several (a week) or the range cuts a month or year,
 * otherwise the bucket's start.
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
			( ( displayResolution === 'month' || displayResolution === 'year' ) &&
				! isWholeBucket( displayResolution, range.from, range.to ) )
		) {
			return formatDateRange( range );
		}
	}

	return formatDate( start, dateFormatForResolution( displayResolution ) );
}

/**
 * External dependencies
 */
import { addDays, format, parseISO, startOfMonth, startOfWeek } from 'date-fns';
/**
 * Internal dependencies
 */
import { getDateIntervalDateParts } from './date';

/**
 * An inclusive range of calendar days, both `yyyy-MM-dd`.
 */
export type DayRange = {
	from: string;
	to: string;
};

/**
 * A calendar bucket: its calendar start, which keys its totals, and its days in the range.
 */
export type RangeBucket = DayRange & {
	date: string;
};

export type RangeBucketPeriod = 'day' | 'week' | 'month';

/**
 * The days of a calendar bucket that fall in a range.
 *
 * @param start  - The bucket's calendar start, `yyyy-MM-dd`.
 * @param period - The bucket size.
 * @param range  - The range to clip to.
 * @return The bucket's first and last day in the range.
 */
export function clipBucketToRange(
	start: string,
	period: RangeBucketPeriod,
	range: DayRange
): DayRange {
	const { endDate } = getDateIntervalDateParts( start, period );

	return {
		from: start < range.from ? range.from : start,
		to: endDate > range.to ? range.to : endDate,
	};
}

/**
 * The calendar buckets that overlap a range, oldest first, weeks starting on Monday as the Stats endpoints key them.
 *
 * @param range  - The range to cover.
 * @param period - The bucket size.
 * @return The buckets, each clipped to the range; none for an inverted range.
 */
export function getRangeBuckets( range: DayRange, period: RangeBucketPeriod ): RangeBucket[] {
	if ( range.from > range.to ) {
		return [];
	}

	const first = parseISO( range.from );
	let start = first;
	if ( period === 'week' ) {
		start = startOfWeek( first, { weekStartsOn: 1 } );
	} else if ( period === 'month' ) {
		start = startOfMonth( first );
	}

	const buckets: RangeBucket[] = [];
	for ( let date = format( start, 'yyyy-MM-dd' ); date <= range.to; ) {
		const bucket = clipBucketToRange( date, period, range );
		buckets.push( { date, ...bucket } );
		date = format(
			addDays( parseISO( getDateIntervalDateParts( date, period ).endDate ), 1 ),
			'yyyy-MM-dd'
		);
	}

	return buckets;
}

/**
 * External dependencies
 */
import {
	endOfDay,
	endOfISOWeek,
	endOfMonth,
	endOfYear,
	startOfDay,
	startOfISOWeek,
	startOfMonth,
	startOfYear,
} from 'date-fns';
/**
 * Internal dependencies
 */
import type { DateRange } from './get-comparison-range';
import type { IntervalType } from './interval';

/**
 * Bucket boundaries per interval a chart can draw.
 *
 * `hour` is absent: an hour is the finest bucket the report offers, so a bar
 * drawn in hours has nothing below it to open.
 */
const BUCKET_BOUNDS: Partial<
	Record< IntervalType, { start: ( date: Date ) => Date; end: ( date: Date ) => Date } >
> = {
	day: { start: startOfDay, end: endOfDay },
	// ISO weeks, matching how the report's own week buckets are cut.
	week: { start: startOfISOWeek, end: endOfISOWeek },
	month: { start: startOfMonth, end: endOfMonth },
	year: { start: startOfYear, end: endOfYear },
};

/**
 * The window behind one chart bucket: the range a click on it should open.
 *
 * The caller applies the result through the usual range machinery, which
 * re-resolves the interval — a bucket's own length never allows the interval
 * that drew it, so the reading always lands one level finer.
 *
 * The end is clamped at `now`, so opening the bucket in progress shows the part
 * of it that exists rather than a window running into the future.
 *
 * Boundaries are cut in `date`'s own timezone, so a `TZDate` carrying the site
 * zone closes its buckets on the site's clock rather than the browser's.
 *
 * @param date     - Any instant inside the bucket, typically the datum's date.
 * @param interval - The interval the bucket was drawn in.
 * @param now      - The current instant, for the clamp.
 * @return The bucket's range, or null when the interval has nothing below it.
 */
export function drillDateRange( date: Date, interval: IntervalType, now: Date ): DateRange | null {
	const bounds = BUCKET_BOUNDS[ interval ];

	if ( ! bounds ) {
		return null;
	}

	const from = bounds.start( date );

	if ( from.getTime() > now.getTime() ) {
		return null;
	}

	const to = bounds.end( date );

	return { from, to: to.getTime() > now.getTime() ? now : to };
}

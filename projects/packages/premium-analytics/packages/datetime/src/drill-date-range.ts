/**
 * External dependencies
 */
import {
	endOfDay,
	endOfISOWeek,
	endOfMonth,
	endOfQuarter,
	endOfYear,
	startOfDay,
	startOfISOWeek,
	startOfMonth,
	startOfQuarter,
	startOfYear,
} from 'date-fns';
/**
 * Internal dependencies
 */
import type { DateRange } from './get-comparison-range';
import type { IntervalType } from './interval';
import type { TZDate } from '@date-fns/tz';

/**
 * Bucket boundaries per interval a chart can draw.
 *
 * `hour` is absent: an hour is the finest bucket the report offers, so a bar
 * drawn in hours has nothing below it to open.
 */
const BUCKET_BOUNDS: Partial<
	Record< IntervalType, { start: ( date: TZDate ) => TZDate; end: ( date: TZDate ) => TZDate } >
> = {
	day: { start: startOfDay, end: endOfDay },
	// ISO weeks, as Stats cuts them. Store reports start a week on the site's first day of the week, so their bucket's own end is passed instead.
	week: { start: startOfISOWeek, end: endOfISOWeek },
	month: { start: startOfMonth, end: endOfMonth },
	quarter: { start: startOfQuarter, end: endOfQuarter },
	year: { start: startOfYear, end: endOfYear },
};

/**
 * Whether a bucket of this interval has a smaller period below it for a click to open.
 *
 * @param interval - The interval the chart draws.
 * @return False for an hour, the finest bucket the report draws.
 */
export function isDrillableInterval( interval: IntervalType ): boolean {
	return interval in BUCKET_BOUNDS;
}

/**
 * The window behind one chart bucket: the range a click on it should open.
 *
 * Boundaries are cut in `date`'s own timezone, so a `TZDate` carrying the site
 * zone closes its buckets on the site's clock rather than the browser's.
 *
 * @param date     - Any instant inside the bucket, typically the datum's date.
 * @param interval - The interval the bucket was drawn in.
 * @param now      - The current instant, for the clamp.
 * @param end      - The bucket's last day as the report states it, with `date` on its first day; the calendar bounds otherwise.
 * @return The bucket's range, or null when the interval has nothing below it.
 */
export function drillDateRange(
	date: TZDate,
	interval: IntervalType,
	now: TZDate,
	end?: TZDate
): DateRange | null {
	const bounds = BUCKET_BOUNDS[ interval ];

	if ( ! bounds ) {
		return null;
	}

	const from = end ? startOfDay( date ) : bounds.start( date );

	if ( from.getTime() > now.getTime() ) {
		return null;
	}

	const to = end ? endOfDay( end ) : bounds.end( date );

	return { from, to: to.getTime() > now.getTime() ? now : to };
}

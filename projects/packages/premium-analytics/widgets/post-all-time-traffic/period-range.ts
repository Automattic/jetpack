/**
 * External dependencies
 */
import {
	createTZDateFromParts,
	drillDateRange,
	startOfDayTZ,
	type DateRange,
} from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import type { MonthKey } from './build-all-time-traffic-rows';

export type PeriodBounds = {
	/** When the post was published; the range never starts before that day. */
	publishedAt?: Date;
	/** The site timezone the calendar month is read in. */
	timeZone: string;
	/** The range never ends after this instant. Defaults to the clock. */
	now?: Date;
};

/**
 * The page range for a month of the table: the calendar month in the site
 * timezone, cut to the post's life. `null` when none of it is inside.
 *
 * @param key    - The month to open.
 * @param bounds - The post's life.
 * @return The range to apply, or `null`.
 */
export function monthRange( key: MonthKey, bounds: PeriodBounds ): DateRange | null {
	const { publishedAt, timeZone, now = new Date() } = bounds;
	// The bucket the traffic chart opens on a click, cut at the clock.
	const bucket = drillDateRange(
		createTZDateFromParts( [ key.year, key.month, 1 ], timeZone ),
		'month',
		now
	);

	if ( ! bucket?.from || ! bucket.to ) {
		return null;
	}

	const publishedDay = publishedAt ? startOfDayTZ( publishedAt, timeZone ) : undefined;
	const from = publishedDay && publishedDay > bucket.from ? publishedDay : bucket.from;

	return from.getTime() <= bucket.to.getTime() ? { from, to: bucket.to } : null;
}

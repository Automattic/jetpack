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
	/** Where the post's life starts; the range never starts before that day. */
	lifeStartsAt?: Date;
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
	const { lifeStartsAt, timeZone, now = new Date() } = bounds;
	// The bucket the traffic chart opens on a click, cut at the clock.
	const bucket = drillDateRange(
		createTZDateFromParts( [ key.year, key.month, 1 ], timeZone ),
		'month',
		now
	);

	if ( ! bucket?.from || ! bucket.to ) {
		return null;
	}

	const firstDay = lifeStartsAt ? startOfDayTZ( lifeStartsAt, timeZone ) : undefined;
	const from = firstDay && firstDay > bucket.from ? firstDay : bucket.from;

	return from.getTime() <= bucket.to.getTime() ? { from, to: bucket.to } : null;
}

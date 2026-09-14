/**
 * External dependencies
 */
import {
	createTZDateFromParts,
	drillDateRange,
	startOfDayTZ,
	toLocalTZ,
	type DateRange,
} from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import type { MonthKey } from './month-key';

export type PeriodBounds = {
	/** Where the subject's life starts, a post's publish day say; the range never starts before it. */
	lifeStartsAt?: Date;
	/** The site timezone the calendar periods are read in. */
	timeZone: string;
	/** The range never ends after this instant. Defaults to the clock. */
	now?: Date;
};

/** The bucket cut to the life, or `null` when none of it is inside. */
function clampToLife( bucket: DateRange | null, { lifeStartsAt, timeZone }: PeriodBounds ) {
	if ( ! bucket?.from || ! bucket.to ) {
		return null;
	}

	const firstDay = lifeStartsAt ? startOfDayTZ( lifeStartsAt, timeZone ) : undefined;
	const from = firstDay && firstDay > bucket.from ? firstDay : bucket.from;

	return from.getTime() <= bucket.to.getTime() ? { from, to: bucket.to } : null;
}

/**
 * The calendar month in the site timezone, cut to the life and at the clock.
 * `null` when none of it is inside.
 *
 * @param key    - The month to open.
 * @param bounds - The life and the clock.
 * @return The range to apply, or `null`.
 */
export function monthRange( key: MonthKey, bounds: PeriodBounds ): DateRange | null {
	const { timeZone, now } = bounds;
	// The bucket the traffic chart opens on a click, cut at the site's clock.
	const bucket = drillDateRange(
		createTZDateFromParts( [ key.year, key.month, 1 ], timeZone ),
		'month',
		toLocalTZ( now, timeZone )
	);

	return clampToLife( bucket, bounds );
}

/**
 * The calendar year in the site timezone, cut the same way as `monthRange`.
 *
 * @param year   - The year to open.
 * @param bounds - The life and the clock.
 * @return The range to apply, or `null`.
 */
export function yearRange( year: number, bounds: PeriodBounds ): DateRange | null {
	const { timeZone, now } = bounds;
	const bucket = drillDateRange(
		createTZDateFromParts( [ year, 0, 1 ], timeZone ),
		'year',
		toLocalTZ( now, timeZone )
	);

	return clampToLife( bucket, bounds );
}

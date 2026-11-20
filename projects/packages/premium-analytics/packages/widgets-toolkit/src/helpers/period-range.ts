/**
 * External dependencies
 */
import {
	bucketStepId,
	createTZDateFromParts,
	drillDateRange,
	type DrillableInterval,
	startOfDayTZ,
	toLocalTZ,
	type DateRange,
	type DateStepId,
	type IntervalType,
} from '@jetpack-premium-analytics/datetime';
import { differenceInCalendarDays } from 'date-fns';
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

/** A chart bucket as a click opens it: the period, and how the date arrows step it. */
export type OpenableBucket = {
	range: Required< DateRange >;
	/**
	 * The bucket's own unit when the period starts where the bucket does, so one cut at
	 * the clock steps whole: Previous from today's bar is all of yesterday. Absent when
	 * the window cut the start, so the arrows measure the period and Next returns to it.
	 */
	step?: DateStepId;
};

/** `range` as an openable bucket, stepped by `interval` only when it opens from `bucket`'s start. */
function openable(
	bucket: DateRange | null,
	range: Required< DateRange > | null,
	interval: IntervalType
): OpenableBucket | null {
	if ( ! range ) {
		return null;
	}

	const step =
		range.from.getTime() === bucket?.from?.getTime() ? bucketStepId( interval ) : undefined;

	return step ? { range, step } : { range };
}

/** The bucket cut to the life, or `null` when none of it is inside. */
function clampToLife(
	bucket: DateRange | null,
	{ lifeStartsAt, timeZone }: PeriodBounds
): Required< DateRange > | null {
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
 * @return The period to apply and its step, or `null`.
 */
export function monthRange( key: MonthKey, bounds: PeriodBounds ): OpenableBucket | null {
	const { timeZone, now } = bounds;
	// The bucket the traffic chart opens on a click, cut at the site's clock.
	const bucket = drillDateRange(
		createTZDateFromParts( [ key.year, key.month, 1 ], timeZone ),
		'month',
		toLocalTZ( now, timeZone )
	);

	return openable( bucket, clampToLife( bucket, bounds ), 'month' );
}

/**
 * The calendar year in the site timezone, cut the same way as `monthRange`.
 *
 * @param year   - The year to open.
 * @param bounds - The life and the clock.
 * @return The period to apply and its step, or `null`.
 */
export function yearRange( year: number, bounds: PeriodBounds ): OpenableBucket | null {
	const { timeZone, now } = bounds;
	const bucket = drillDateRange(
		createTZDateFromParts( [ year, 0, 1 ], timeZone ),
		'year',
		toLocalTZ( now, timeZone )
	);

	return openable( bucket, clampToLife( bucket, bounds ), 'year' );
}

/**
 * The chart bucket holding `date`, cut to the window the chart draws. `null` for
 * a bucket outside the window.
 *
 * @param clicked         - The clicked bucket.
 * @param clicked.date    - A date inside the bucket, its first day when `endDate` is set.
 * @param clicked.endDate - The bucket's last day as the report states it; the calendar bucket otherwise.
 * @param interval        - The bucket size the chart drew.
 * @param window          - The range the chart draws.
 * @param bounds          - The site zone the bucket is cut in, and the clock capping it.
 * @return The period to apply and its step, or `null`.
 */
export function bucketRange(
	{ date, endDate }: { date: Date; endDate?: Date },
	interval: DrillableInterval,
	window: DateRange,
	bounds: Omit< PeriodBounds, 'lifeStartsAt' >
): OpenableBucket | null {
	const { timeZone, now } = bounds;
	const localDate = toLocalTZ( date, timeZone );
	const localNow = toLocalTZ( now, timeZone );
	// Re-anchored to the site zone: `drillDateRange` closes a bucket on the clock of the date it gets.
	const bucket = drillDateRange(
		localDate,
		interval,
		localNow,
		endDate && toLocalTZ( endDate, timeZone )
	);

	if ( ! bucket?.from || ! bucket.to ) {
		return null;
	}

	const stated = { from: bucket.from, to: bucket.to };
	// An edge bucket is usually partial; opening it whole would widen the report past the window.
	const from = window.from && stated.from < window.from ? window.from : stated.from;
	const to = window.to && stated.to > window.to ? window.to : stated.to;

	return openable(
		statedWhole( stated, interval ) ? stated : drillDateRange( localDate, interval, localNow ),
		from.getTime() < to.getTime() ? { from, to } : null,
		interval
	);
}

/**
 * Whether a bucket the report states spans its whole unit. A report stamps a bucket the
 * window cuts with the window's edge, so a stated start says nothing about the bucket's
 * own; only a stated week that runs seven days (a store week) is whole as stated.
 */
function statedWhole( bucket: Required< DateRange >, interval: IntervalType ): boolean {
	return interval === 'week' && differenceInCalendarDays( bucket.to, bucket.from ) === 6;
}

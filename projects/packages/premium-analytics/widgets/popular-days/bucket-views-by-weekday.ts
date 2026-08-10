/**
 * External dependencies
 */
import { getDatePart } from '@jetpack-premium-analytics/datetime';
import { format, getDay, isValid, parse } from 'date-fns';

export type PopularDayBucket = {
	/** 0 = Monday … 6 = Sunday, matching the package's `weekStartsOn: 1` convention. */
	weekday: number;
	/** Localized full weekday name, e.g. "Monday". */
	label: string;
	total: number;
	/** How many times this weekday fell inside the selected range. */
	occurrences: number;
	/** `total / occurrences`, or 0 for a weekday the range never covered. */
	average: number;
};

const DATE_PART_FORMAT = 'yyyy-MM-dd';

// date-fns only reads this when the parsed string omits a field; every field we
// parse is present, so it never contributes to the result.
const referenceDate = new Date( 2001, 0, 1 );

// 2026-01-05 is a Monday. Stepping forward from it gives the seven weekday names
// in this widget's Monday-first order without depending on today's date.
const WEEKDAY_NAME_ANCHOR = new Date( 2026, 0, 5, 12 );

function weekdayLabel( weekday: number ) {
	const date = new Date( WEEKDAY_NAME_ANCHOR );
	date.setDate( date.getDate() + weekday );

	return format( date, 'EEEE' );
}

/**
 * Read a row's calendar date as wall-clock, never as an instant.
 *
 * `date_start` carries a nominal `+00:00` that labels a calendar bucket rather
 * than marking a real UTC time (see `getDateFnsIntervalFields` in the stats
 * time-series normalizer). Handing it to `new Date()` would resolve it against
 * the viewer's timezone and slide the row onto the previous weekday for anyone
 * west of Greenwich.
 */
function readRowDate( row: Record< string, unknown > ) {
	const datePart = getDatePart( row.date_start ?? row.time_interval ?? row.period );

	if ( ! datePart ) {
		return undefined;
	}

	const parsed = parse( datePart, DATE_PART_FORMAT, referenceDate );

	return isValid( parsed ) && format( parsed, DATE_PART_FORMAT ) === datePart ? parsed : undefined;
}

function readRowViews( row: Record< string, unknown > ) {
	const views = row.views ?? row.value;

	return typeof views === 'number' ? views : Number( views ?? 0 ) || 0;
}

/**
 * Fold a daily `stats/visits` series into one bucket per day of the week.
 *
 * Always returns seven buckets so the chart keeps a stable shape, including for
 * weekdays the range never covered — those carry `occurrences: 0` and are
 * excluded from the peak by `pickPeakWeekday`.
 */
export function bucketViewsByWeekday( rows: Record< string, unknown >[] ): PopularDayBucket[] {
	const totals = Array.from( { length: 7 }, () => ( { total: 0, occurrences: 0 } ) );

	rows.forEach( row => {
		const date = readRowDate( row );

		if ( ! date ) {
			return;
		}

		// date-fns counts from Sunday; shift to the Monday-first order used here.
		const weekday = ( getDay( date ) + 6 ) % 7;

		totals[ weekday ].total += readRowViews( row );
		// Counted even when the day drew no views: a weekday that reliably draws
		// nothing must average as a real zero, not drop out of the comparison.
		totals[ weekday ].occurrences += 1;
	} );

	return totals.map( ( { total, occurrences }, weekday ) => ( {
		weekday,
		label: weekdayLabel( weekday ),
		total,
		occurrences,
		average: occurrences ? total / occurrences : 0,
	} ) );
}

/**
 * The busiest weekday by mean views per occurrence.
 *
 * Averaging rather than summing is load-bearing: a user-selected range rarely
 * spans a whole number of weeks, so some weekdays are sampled more often than
 * others — over 30 days, two weekdays occur five times and five occur four. A
 * total would let that extra sample alone decide the winner.
 */
export function pickPeakWeekday( buckets: PopularDayBucket[] ): PopularDayBucket | undefined {
	return buckets
		.filter( bucket => bucket.occurrences > 0 )
		.reduce< PopularDayBucket | undefined >(
			( peak, bucket ) => ( ! peak || bucket.average > peak.average ? bucket : peak ),
			undefined
		);
}

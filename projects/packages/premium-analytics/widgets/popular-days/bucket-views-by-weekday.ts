/**
 * External dependencies
 */
import { getDatePart } from '@jetpack-premium-analytics/datetime';
import { format, getDay, isValid, parse } from 'date-fns';

export type PopularDayBucket = {
	/** 0 = Monday … 6 = Sunday, matching the package's `weekStartsOn: 1` convention. */
	weekday: number;
	label: string;
	total: number;
	/** How many times this weekday fell inside the selected range. */
	occurrences: number;
	average: number;
};

const DATE_PART_FORMAT = 'yyyy-MM-dd';

// Only consulted for fields the parsed string omits, and ours omits none.
const referenceDate = new Date( 2001, 0, 1 );

// A Monday, so stepping forward yields the names in Monday-first order.
const WEEKDAY_NAME_ANCHOR = new Date( 2026, 0, 5, 12 );

function weekdayLabel( weekday: number ) {
	const date = new Date( WEEKDAY_NAME_ANCHOR );
	date.setDate( date.getDate() + weekday );

	return format( date, 'EEEE' );
}

// The `+00:00` on `date_start` labels a calendar bucket rather than marking a
// real UTC time, so `new Date()` would resolve it against the viewer's timezone
// and slide the row onto the previous weekday west of Greenwich.
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
 * Always seven buckets, so the chart keeps a stable shape; weekdays the range
 * never covered carry `occurrences: 0` and are skipped by `pickPeakWeekday`.
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
		// Counted even at zero views, so a reliably quiet weekday averages as a
		// real zero instead of dropping out of the comparison.
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
 * Mean, not total: a selected range rarely spans a whole number of weeks — over
 * 30 days two weekdays occur five times and five occur four — so a total would
 * let that extra occurrence alone decide the winner.
 */
export function pickPeakWeekday( buckets: PopularDayBucket[] ): PopularDayBucket | undefined {
	return buckets
		.filter( bucket => bucket.occurrences > 0 )
		.reduce< PopularDayBucket | undefined >(
			( peak, bucket ) => ( ! peak || bucket.average > peak.average ? bucket : peak ),
			undefined
		);
}

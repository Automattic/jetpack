const DAY_MS = 24 * 60 * 60 * 1000;

/** A window wide enough for any story, and a stop for a malformed one. */
const MAX_BUCKETS = 400;

// The value shapes every store report sends: a monetary amount, and a whole count.
export const money = ( value: number ) => value.toFixed( 2 );
export const count = ( value: number ) => String( Math.round( value ) );

export type ReportBucket = {
	date_start: string;
	date_end: string;
	time_interval: string;
	/** The bucket start's absolute day number, so a fixture can anchor its values to the calendar. */
	dayIndex: number;
};

type IntervalSteps = {
	start: ( ms: number ) => number;
	next: ( ms: number ) => number;
	label: ( ms: number ) => string;
};

const pad = ( value: number ) => String( value ).padStart( 2, '0' );

const isoDate = ( ms: number ) => {
	const date = new Date( ms );

	return `${ date.getUTCFullYear() }-${ pad( date.getUTCMonth() + 1 ) }-${ pad(
		date.getUTCDate()
	) }`;
};

const weekdayIndex = ( ms: number ) => ( new Date( ms ).getUTCDay() + 6 ) % 7;

const mondayOf = ( ms: number ) => ms - weekdayIndex( ms ) * DAY_MS;

const addMonths = ( ms: number, months: number ) => {
	const date = new Date( ms );

	return Date.UTC( date.getUTCFullYear(), date.getUTCMonth() + months, 1 );
};

/**
 * The ISO week-numbering year and week of the week a day falls in.
 *
 * @param {number} ms - Any instant inside the week.
 * @return {object} The week-numbering year and the week number.
 */
function isoWeek( ms: number ) {
	const monday = mondayOf( ms );
	const year = new Date( monday + 3 * DAY_MS ).getUTCFullYear();
	const firstMonday = mondayOf( Date.UTC( year, 0, 4 ) );

	return { year, week: Math.round( ( monday - firstMonday ) / ( 7 * DAY_MS ) ) + 1 };
}

// The labels WooCommerce's `TimeInterval` writes for each interval.
const INTERVAL_STEPS: Record< string, IntervalSteps > = {
	day: {
		start: ms => ms,
		next: ms => ms + DAY_MS,
		label: isoDate,
	},
	week: {
		start: mondayOf,
		next: ms => mondayOf( ms ) + 7 * DAY_MS,
		label: ms => {
			const { year, week } = isoWeek( ms );

			return `${ year }-${ pad( week ) }`;
		},
	},
	month: {
		start: ms => addMonths( ms, 0 ),
		next: ms => addMonths( ms, 1 ),
		label: ms => isoDate( ms ).slice( 0, 7 ),
	},
	quarter: {
		start: ms => addMonths( ms, -( new Date( ms ).getUTCMonth() % 3 ) ),
		next: ms => addMonths( ms, 3 - ( new Date( ms ).getUTCMonth() % 3 ) ),
		label: ms => {
			const date = new Date( ms );

			return `${ date.getUTCFullYear() }-${ Math.floor( date.getUTCMonth() / 3 ) + 1 }`;
		},
	},
	year: {
		start: ms => Date.UTC( new Date( ms ).getUTCFullYear(), 0, 1 ),
		next: ms => Date.UTC( new Date( ms ).getUTCFullYear() + 1, 0, 1 ),
		label: ms => String( new Date( ms ).getUTCFullYear() ),
	},
};

/**
 * Reads a date from a request param or a bucket stamp as a UTC midnight.
 *
 * @param {string|null|undefined} value - A `YYYY-MM-DD` date, with or without a time after it.
 * @return {number} The day's UTC midnight in milliseconds, or `NaN` for anything else.
 */
function utcMidnight( value: string | null | undefined ): number {
	const parts = ( value ?? '' ).slice( 0, 10 ).split( '-' ).map( Number );

	if ( parts.length !== 3 || parts.some( part => ! Number.isFinite( part ) ) ) {
		return NaN;
	}

	return Date.UTC( parts[ 0 ], parts[ 1 ] - 1, parts[ 2 ] );
}

/**
 * The absolute day number of a date, counted from the Unix epoch.
 *
 * @param {string} dateText - A `YYYY-MM-DD` date, with or without a time after it.
 * @return {number} The day number, or `NaN` when the date cannot be read.
 */
export function dayIndexOf( dateText: string ): number {
	return Math.floor( utcMidnight( dateText ) / DAY_MS );
}

/** The day every fixture's trend grows from, shared so the reports stay consistent with each other. */
export const ANCHOR_DAY = dayIndexOf( '2026-01-01' );

/**
 * How many days a set of buckets covers. Taken from the dates rather than the bucket
 * count, which only agree while the interval is a day.
 *
 * @param {ReportBucket[]} buckets - The window's buckets, oldest first.
 * @return {number} The number of days covered, or 0 for an empty window.
 */
export function windowDays( buckets: ReportBucket[] ): number {
	const last = buckets[ buckets.length - 1 ];

	return last ? dayIndexOf( last.date_end ) - buckets[ 0 ].dayIndex + 1 : 0;
}

/**
 * The buckets a report request covers, oldest first, with the bounds and label the live
 * endpoint gives them. The first and last bucket are clipped to the requested window.
 *
 * @param {URLSearchParams} query - The request's query params (`from`, `to`, `interval`).
 * @return {ReportBucket[]} One bucket per interval step, or none for a window it cannot read.
 */
export function bucketsForWindow( query: URLSearchParams ): ReportBucket[] {
	const fromMs = utcMidnight( query.get( 'from' ) );
	const toMs = utcMidnight( query.get( 'to' ) );

	if ( Number.isNaN( fromMs ) || Number.isNaN( toMs ) || toMs < fromMs ) {
		return [];
	}

	const steps = INTERVAL_STEPS[ query.get( 'interval' ) ?? 'day' ] ?? INTERVAL_STEPS.day;
	const buckets: ReportBucket[] = [];
	let cursor = steps.start( fromMs );

	while ( cursor <= toMs && buckets.length < MAX_BUCKETS ) {
		const next = steps.next( cursor );
		const startMs = Math.max( cursor, fromMs );
		const endMs = Math.min( next - DAY_MS, toMs );

		buckets.push( {
			date_start: `${ isoDate( startMs ) } 00:00:00`,
			date_end: `${ isoDate( endMs ) } 23:59:59`,
			time_interval: steps.label( cursor ),
			dayIndex: Math.floor( startMs / DAY_MS ),
		} );

		cursor = next;
	}

	return buckets;
}

import type { PodcastStatsPeriod, PodcastStatsRange } from './types';

const ALL_TIME_CHART_DAYS = 365;

const PERIOD_DAYS: Record< PodcastStatsPeriod, number > = {
	'7d': 7,
	'30d': 30,
	'90d': 90,
	all: ALL_TIME_CHART_DAYS,
};

const toUtcDateString = ( date: Date ) => date.toISOString().slice( 0, 10 );

const subtractUtcDays = ( date: Date, days: number ) => {
	const next = new Date( date );
	next.setUTCDate( next.getUTCDate() - days );
	return next;
};

/**
 * Inclusive UTC date range for a period.
 *
 * @param period - Period.
 * @return       From/to range.
 */
export function getStatsDateRange( period: PodcastStatsPeriod ): PodcastStatsRange {
	const toDate = new Date();
	const to = toUtcDateString( toDate );
	const days = PERIOD_DAYS[ period ];
	const from = toUtcDateString( subtractUtcDays( toDate, days - 1 ) );
	return { from, to };
}

const MS_PER_DAY = 86400000;

/**
 * Inclusive day count. Prefer API range so 'all' reflects actual span, not the 365 cap.
 *
 * @param period - Period.
 * @param range  - Optional API-reported range.
 * @return       Day count.
 */
export function getPeriodDayCount( period: PodcastStatsPeriod, range?: PodcastStatsRange ): number {
	if ( range?.from && range?.to ) {
		const fromMs = Date.parse( `${ range.from }T00:00:00Z` );
		const toMs = Date.parse( `${ range.to }T00:00:00Z` );
		if ( ! Number.isNaN( fromMs ) && ! Number.isNaN( toMs ) && toMs >= fromMs ) {
			return Math.round( ( toMs - fromMs ) / MS_PER_DAY ) + 1;
		}
	}
	return PERIOD_DAYS[ period ];
}

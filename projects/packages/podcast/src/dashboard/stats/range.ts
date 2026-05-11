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
 * Inclusive UTC date range for a given stats period.
 *
 * @param period - Period selector.
 * @return       Range with ISO `from` and `to` date strings.
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
 * Inclusive day count for a stats period. Prefers the API-reported range so
 * 'all' reflects the actual returned span (not the 365-day chart cap); falls
 * back to the static period length when `range` is missing or unparseable.
 *
 * @param period - Selected period.
 * @param range  - Optional range from the API response.
 * @return       Inclusive day count, minimum 1.
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

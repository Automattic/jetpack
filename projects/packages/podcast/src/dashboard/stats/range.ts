import type { PodcastStatsPeriod, PodcastStatsRange, PodcastStatsSelection } from './types';

const ALL_TIME_CHART_DAYS = 365;

const PERIOD_DAYS: Record< Exclude< PodcastStatsPeriod, 'custom' >, number > = {
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
 * Inclusive UTC date range for a preset period. Throws for 'custom' — callers
 * with a custom range should use it directly.
 *
 * @param period - Preset period.
 * @return       From/to range.
 */
export function getStatsDateRange(
	period: Exclude< PodcastStatsPeriod, 'custom' >
): PodcastStatsRange {
	const toDate = new Date();
	const to = toUtcDateString( toDate );
	const days = PERIOD_DAYS[ period ];
	const from = toUtcDateString( subtractUtcDays( toDate, days - 1 ) );
	return { from, to };
}

/**
 * Resolved range for a selection — preset periods compute against "now",
 * custom returns the explicit range.
 *
 * @param selection - Selection.
 * @return          From/to range.
 */
export function resolveSelectionRange( selection: PodcastStatsSelection ): PodcastStatsRange {
	if ( selection.period === 'custom' ) {
		return selection.range;
	}
	return getStatsDateRange( selection.period );
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
	if ( period === 'custom' ) {
		return 0;
	}
	return PERIOD_DAYS[ period ];
}

/**
 * Default selection — last 30 days as a preset.
 *
 * @return Selection.
 */
export function getDefaultSelection(): PodcastStatsSelection {
	return { period: '30d', range: getStatsDateRange( '30d' ) };
}

/**
 * Build a selection from a Date range chosen in the picker. Matches the
 * range against the known preset periods (7d / 30d / 90d / all) so a user
 * who hand-picks "Last 30 days" still gets the preset semantics back —
 * notably, summary totals sourced from the overview endpoint.
 *
 * @param start - Range start.
 * @param end   - Range end.
 * @return      Selection.
 */
export function selectionFromDates( start: Date, end: Date ): PodcastStatsSelection {
	const fromYmd = ymdFromLocalDate( start );
	const toYmd = ymdFromLocalDate( end );
	const range: PodcastStatsRange = { from: fromYmd, to: toYmd };
	const today = ymdFromLocalDate( new Date() );
	if ( toYmd === today ) {
		const inclusiveDays =
			Math.round(
				( Date.parse( `${ toYmd }T00:00:00Z` ) - Date.parse( `${ fromYmd }T00:00:00Z` ) ) /
					MS_PER_DAY
			) + 1;
		if ( inclusiveDays === PERIOD_DAYS[ '7d' ] ) {
			return { period: '7d', range };
		}
		if ( inclusiveDays === PERIOD_DAYS[ '30d' ] ) {
			return { period: '30d', range };
		}
		if ( inclusiveDays === PERIOD_DAYS[ '90d' ] ) {
			return { period: '90d', range };
		}
		if ( inclusiveDays === PERIOD_DAYS.all ) {
			return { period: 'all', range };
		}
	}
	return { period: 'custom', range };
}

/**
 * Parse a `YYYY-MM-DD` string into a local-midnight Date.
 *
 * @param ymd - YYYY-MM-DD.
 * @return    Date.
 */
export function localDateFromYmd( ymd: string ): Date {
	const [ year, month, day ] = ymd.split( '-' ).map( Number );
	return new Date( year, ( month ?? 1 ) - 1, day ?? 1 );
}

const ymdFromLocalDate = ( date: Date ) => {
	const year = date.getFullYear();
	const month = String( date.getMonth() + 1 ).padStart( 2, '0' );
	const day = String( date.getDate() ).padStart( 2, '0' );
	return `${ year }-${ month }-${ day }`;
};

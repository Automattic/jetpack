import { formatDatePartWithTime, getDatePart } from '@jetpack-premium-analytics/datetime';
import {
	endOfISOWeek,
	endOfMonth,
	endOfYear,
	format,
	isValid,
	parse,
	startOfISOWeek,
	startOfMonth,
	startOfYear,
} from 'date-fns';
import { safeParseFloat } from '../../utils/parsing';
import {
	coerceStatsArray,
	coerceStatsRecord,
	getStatsIntervalFields,
	normalizeStatsSummary,
} from './utils';
import type {
	StatsNormalizedDataPoint,
	StatsNormalizedReport,
	StatsNormalizedSummary,
	StatsRecord,
} from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export type StatsTimeSeriesDataPoint = StatsNormalizedDataPoint & {
	label: string;
	value: number;
};

export type StatsTimeSeriesReport = StatsNormalizedReport & {
	data: StatsTimeSeriesDataPoint[];
};

const nonMetricFields = [ 'period', 'time_interval', 'date', 'date_start', 'date_end', 'hour' ];
const dateFormat = 'yyyy-MM-dd';
const referenceDate = new Date( 2001, 0, 1 );

function numericTimeSeriesRow( row: StatsRecord ) {
	return Object.fromEntries(
		Object.entries( row ).map( ( [ key, value ] ) => [
			key,
			nonMetricFields.includes( key ) ||
			! ( typeof value === 'number' || typeof value === 'string' )
				? value
				: safeParseFloat( value ),
		] )
	);
}

function parseMatrixRows( payload: unknown ) {
	const response = coerceStatsRecord( payload );
	const fields = coerceStatsArray< string >( response.fields );

	if ( ! fields.length ) {
		return [];
	}

	return coerceStatsArray< unknown[] >( response.data ).map( record => {
		const parsed: StatsRecord = {};
		record.forEach( ( value, index ) => {
			const field = fields[ index ];

			if ( field ) {
				parsed[ field ] = value;
			}
		} );

		return numericTimeSeriesRow( parsed );
	} );
}

function parseTimeSeriesRows( payload: unknown ) {
	const response = coerceStatsRecord( payload );
	const matrixRows = parseMatrixRows( response );

	if ( matrixRows.length ) {
		return matrixRows;
	}

	const dataRows = coerceStatsArray< StatsRecord >( response.data );

	if ( dataRows.length ) {
		return dataRows.map( numericTimeSeriesRow );
	}

	return Object.entries( coerceStatsRecord( response.days ) ).map( ( [ period, value ] ) => {
		if ( typeof value === 'number' || typeof value === 'string' ) {
			return numericTimeSeriesRow( { period, value } );
		}

		return numericTimeSeriesRow( { period, ...coerceStatsRecord( value ) } );
	} );
}

// Not `localeCompare`: a collation may ignore the separators these bounds carry.
function compareBucketBounds( a: string, b: string ) {
	if ( a === b ) {
		return 0;
	}

	return a < b ? -1 : 1;
}

function getPrimaryMetricValue( row: StatsRecord ) {
	// The first numeric metric is the headline value; matrix payloads preserve API field order.
	const primaryMetric = Object.entries( row ).find(
		( [ key, value ] ) => ! nonMetricFields.includes( key ) && typeof value === 'number'
	);

	return primaryMetric?.[ 1 ] ?? 0;
}

function getDateFnsIntervalFields( startDate: Date, endDate: Date ) {
	return {
		time_interval: format( startDate, dateFormat ),
		date_start: formatDatePartWithTime( format( startDate, dateFormat ), '00:00:00' ),
		date_end: formatDatePartWithTime( format( endDate, dateFormat ), '23:59:59' ),
	};
}

function getWeekIntervalFields( period: string ) {
	const match = period.match( /^(\d{4})-?W?(\d{1,2})$/ );

	if ( ! match ) {
		return null;
	}

	const normalizedPeriod = `${ match[ 1 ] }-W${ match[ 2 ].padStart( 2, '0' ) }`;
	const parsed = parse( normalizedPeriod, "RRRR-'W'II", referenceDate );

	if ( ! isValid( parsed ) || format( parsed, "RRRR-'W'II" ) !== normalizedPeriod ) {
		return null;
	}

	return getDateFnsIntervalFields( startOfISOWeek( parsed ), endOfISOWeek( parsed ) );
}

// WPCOM stats weekly labels arrive as `YYYY'W'MM'W'DD`, where the trailing
// month/day is the week's start date (e.g. `2026W06W29` → week of 2026-06-29).
function getWpcomWeekIntervalFields( period: string ) {
	const match = period.match( /^(\d{4})W(\d{2})W(\d{2})$/ );

	if ( ! match ) {
		return null;
	}

	const parsed = parse(
		`${ match[ 1 ] }-${ match[ 2 ] }-${ match[ 3 ] }`,
		'yyyy-MM-dd',
		referenceDate
	);

	if ( ! isValid( parsed ) ) {
		return null;
	}

	return getDateFnsIntervalFields( startOfISOWeek( parsed ), endOfISOWeek( parsed ) );
}

function getMonthIntervalFields( period: string ) {
	const parsed = parse( period, 'yyyy-MM', referenceDate );

	if ( ! isValid( parsed ) || format( parsed, 'yyyy-MM' ) !== period ) {
		return null;
	}

	return getDateFnsIntervalFields( startOfMonth( parsed ), endOfMonth( parsed ) );
}

function getYearIntervalFields( period: string ) {
	const parsed = parse( period, 'yyyy', referenceDate );

	if ( ! isValid( parsed ) || format( parsed, 'yyyy' ) !== period ) {
		return null;
	}

	return getDateFnsIntervalFields( startOfYear( parsed ), endOfYear( parsed ) );
}

function getTimeSeriesIntervalFields( period: unknown, unit?: string ) {
	const periodString = typeof period === 'string' ? period : '';

	if ( unit === 'week' ) {
		return (
			getWeekIntervalFields( periodString ) ??
			getWpcomWeekIntervalFields( periodString ) ??
			getStatsIntervalFields( periodString, unit )
		);
	}

	if ( unit === 'month' ) {
		return getMonthIntervalFields( periodString ) ?? getStatsIntervalFields( periodString, unit );
	}

	if ( unit === 'year' ) {
		return getYearIntervalFields( periodString ) ?? getStatsIntervalFields( periodString, unit );
	}

	return getStatsIntervalFields( periodString, unit );
}

function getHourIntervalFields( date: string, hour: unknown ) {
	const datePart = getDatePart( date ) ?? date;
	const hourPart = String( Math.trunc( Number( hour ) ) || 0 ).padStart( 2, '0' );

	// Like getStatsIntervalFields, these are timezone-naive calendar bucket labels — the API's
	// hour is already site-local, so no offset is stamped for a consumer to convert across.
	return {
		time_interval: `${ datePart } ${ hourPart }:00`,
		date_start: formatDatePartWithTime( datePart, `${ hourPart }:00:00` ),
		date_end: formatDatePartWithTime( datePart, `${ hourPart }:59:59` ),
	};
}

// `stats/visits` packs an hourly bucket's date and hour into a single `period`,
// where the email timeline carries the hour in its own column.
const packedHourlyPeriod = /^(\d{4}-\d{2}-\d{2})[T ](\d{2})/;

function getRowIntervalFields( row: StatsRecord, rawPeriod: unknown, unit: string ) {
	if ( unit === 'hour' && row.hour !== undefined && typeof rawPeriod === 'string' ) {
		return getHourIntervalFields( rawPeriod, row.hour );
	}

	if ( typeof row.date_start === 'string' && typeof row.date_end === 'string' ) {
		return {
			time_interval: row.date_start,
			date_start: row.date_start,
			date_end: row.date_end,
		};
	}

	if ( unit === 'hour' && typeof rawPeriod === 'string' ) {
		const packed = rawPeriod.match( packedHourlyPeriod );

		if ( packed ) {
			return getHourIntervalFields( packed[ 1 ], packed[ 2 ] );
		}
	}

	return getTimeSeriesIntervalFields( rawPeriod, unit );
}

// Rebuild a summary bound from a query date when no rows came back. Rows stamp
// `date_start`/`date_end` as timezone-naive wall times (see
// getStatsIntervalFields), so the query's own site-local offset can't be passed
// through verbatim — a real offset would get converted rather than read as the
// bucket's label. Mirrors getStatsSummaryIntervalFields.
function toSummaryBound( value: string | undefined, time: string ) {
	const datePart = getDatePart( value );

	return datePart ? formatDatePartWithTime( datePart, time ) : '';
}

function getTimeSeriesSummarySidecars( response: StatsRecord ) {
	return {
		...normalizeStatsSummary( coerceStatsRecord( response.summary ) ),
		...normalizeStatsSummary( coerceStatsRecord( response.opens_rate ) ),
		...normalizeStatsSummary( coerceStatsRecord( response.clicks_rate ) ),
		...normalizeStatsSummary( coerceStatsRecord( response.rate ) ),
	};
}

// The timestamp shapes report params can carry (a subset of the datetime
// package's SITE_TIMESTAMP): a calendar date, optionally followed by a
// T- or space-separated wall time with optional seconds; any offset or
// milliseconds after that are irrelevant to a wall-clock bound.
const WALL_CLOCK_PARTS = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/;

// A trim-window bound in the same timezone-naive wall-clock shape the bucket
// labels carry: the value's own date and time parts as written, any offset
// ignored. A bare date widens to the whole day via the fallback time, whose
// seconds also fill in for a seconds-less time.
function toWallClockBound( value: string | undefined, fallbackTime: string ) {
	const match = typeof value === 'string' ? WALL_CLOCK_PARTS.exec( value.trim() ) : null;

	if ( ! match ) {
		return undefined;
	}

	const [ , datePart, hours, minutes, seconds ] = match;
	const time = hours
		? `${ hours }:${ minutes }:${ seconds ?? fallbackTime.slice( 6 ) }`
		: fallbackTime;

	return formatDatePartWithTime( datePart, time );
}

// Bucket bounds are comparable against a window bound only in this shape;
// a row whose bounds fall outside it (an unparseable period label echoed
// back verbatim) is kept rather than silently discarded.
const isWallClockStamp = ( value: string ) => /^\d{4}-\d{2}-\d{2}T/.test( value );

export function isStatsTimeSeriesPayload( payload: unknown ) {
	const response = coerceStatsRecord( payload );

	if (
		coerceStatsArray( response.fields ).length ||
		Object.keys( coerceStatsRecord( response.days ) ).length
	) {
		return true;
	}

	const firstRow = coerceStatsRecord( coerceStatsArray< StatsRecord >( response.data )[ 0 ] );

	return Boolean(
		firstRow.period || firstRow.time_interval || firstRow.date || firstRow.date_start
	);
}

export function sanitizeStatsTimeSeriesResponse(
	payload: unknown,
	query?: StatsQueryParams
): StatsTimeSeriesReport {
	const response = coerceStatsRecord( payload );
	const unit = String( response.unit ?? query?.period ?? 'day' );
	const buckets = parseTimeSeriesRows( payload ).map( row => {
		const rawPeriod = row.period ?? row.time_interval ?? row.date_start ?? row.date;

		return { row, range: getRowIntervalFields( row, rawPeriod, unit ) };
	} );
	// Trim to the caller's window when it names one — before the summary, so
	// out-of-window buckets inflate neither the totals nor the chart.
	// Quantity-based endpoints (the email timeline) anchor hourly buckets on
	// the start day's midnight regardless of the requested time of day, so a
	// mid-day window comes back with leading out-of-window buckets. Request
	// params never reach a sanitizer as `end_date` (statsQueryParamsToApiParams
	// renames it to `date` — an invariant pinned in the stats-params tests), so
	// only callers passing a window through `sanitizerParams` opt in. Rows
	// whose bounds aren't comparable wall clocks are kept, not dropped.
	const windowStart = toWallClockBound( query?.start_date, '00:00:00' );
	const windowEnd = toWallClockBound( query?.end_date, '23:59:59' );
	const kept =
		windowStart && windowEnd
			? buckets.filter(
					( { range } ) =>
						! isWallClockStamp( range.date_start ) ||
						! isWallClockStamp( range.date_end ) ||
						( compareBucketBounds( range.date_end, windowStart ) >= 0 &&
							compareBucketBounds( range.date_start, windowEnd ) <= 0 )
			  )
			: buckets;
	const summary = kept.reduce< Record< string, number > >( ( totals, { row } ) => {
		Object.entries( row ).forEach( ( [ key, value ] ) => {
			if ( ! nonMetricFields.includes( key ) && typeof value === 'number' ) {
				totals[ key ] = ( totals[ key ] ?? 0 ) + value;
			}
		} );

		return totals;
	}, {} );
	const data = kept
		.map< StatsTimeSeriesDataPoint >( ( { row, range } ) => {
			const value = safeParseFloat( getPrimaryMetricValue( row ) );

			return {
				...row,
				...range,
				label: range.time_interval,
				value,
				items: [],
			};
		} )
		// `stats/visits` returns buckets oldest first, `stats/subscribers` newest
		// first, but everything downstream reads `data[0]` as the oldest bucket —
		// starting with the summary bounds below.
		.sort( ( a, b ) => compareBucketBounds( a.date_start, b.date_start ) );
	const firstRow = data[ 0 ];
	const lastRow = data[ data.length - 1 ];

	return {
		summary: {
			...getTimeSeriesSummarySidecars( response ),
			...summary,
			date_start: firstRow?.date_start ?? toSummaryBound( query?.start_date, '00:00:00' ),
			date_end: lastRow?.date_end ?? toSummaryBound( query?.end_date ?? query?.date, '23:59:59' ),
		},
		data,
	};
}

export type StatsEmailTimeSeriesDataPoint = StatsTimeSeriesDataPoint & {
	opens_count?: number;
	clicks_count?: number;
};

export type StatsEmailTimeSeriesSummary = StatsNormalizedSummary & {
	opens_count?: number;
	clicks_count?: number;
};

export type StatsEmailTimeSeriesReport = StatsNormalizedReport & {
	summary: StatsEmailTimeSeriesSummary;
	data: StatsEmailTimeSeriesDataPoint[];
};

export function sanitizeStatsEmailTimeSeriesResponse(
	payload: unknown,
	query?: StatsQueryParams
): StatsEmailTimeSeriesReport {
	// Email opens/clicks timelines nest their matrix under a `timeline` key (requested via
	// stats_fields=timeline), unlike the generic time series endpoints that return it top-level.
	const timeline = coerceStatsRecord( coerceStatsRecord( payload ).timeline );
	const fields = coerceStatsArray< string >( timeline.fields );

	// The real hourly timeline labels its hour column ([ 'date', 'hour', '<metric>_count' ]), which
	// the normalizer resolves into per-hour buckets. As a fallback, an unlabeled trailing hour
	// column is named here so older/alternate payloads still resolve (matching Calypso's
	// parseEmailChartData).
	const normalizedTimeline =
		timeline.unit === 'hour' && fields.length && ! fields.includes( 'hour' )
			? { ...timeline, fields: [ ...fields, 'hour' ] }
			: timeline;

	return sanitizeStatsTimeSeriesResponse( normalizedTimeline, query );
}

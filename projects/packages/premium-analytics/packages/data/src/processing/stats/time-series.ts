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

function getPrimaryMetricValue( row: StatsRecord ) {
	// The first numeric metric is the headline value; matrix payloads preserve API field order.
	const primaryMetric = Object.entries( row ).find(
		( [ key, value ] ) => ! nonMetricFields.includes( key ) && typeof value === 'number'
	);

	return primaryMetric?.[ 1 ] ?? 0;
}

function getDateFnsIntervalFields( startDate: Date, endDate: Date ) {
	// Stats interval fields are normalized calendar bucket labels, matching getStatsIntervalFields.
	// They are not intended to be reinterpreted as site-timezone instants downstream.
	return {
		time_interval: format( startDate, dateFormat ),
		date_start: `${ format( startDate, dateFormat ) }T00:00:00+00:00`,
		date_end: `${ format( endDate, dateFormat ) }T23:59:59+00:00`,
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

	// Like getStatsIntervalFields, these are calendar bucket labels stamped with a nominal +00:00
	// (formatDatePartWithTime's default), not real UTC instants — the API's hour is already
	// site-local, so a consumer must render the bucket as wall-clock rather than convert it across
	// the site offset.
	return {
		time_interval: `${ datePart } ${ hourPart }:00`,
		date_start: formatDatePartWithTime( datePart, `${ hourPart }:00:00` ),
		date_end: formatDatePartWithTime( datePart, `${ hourPart }:59:59` ),
	};
}

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

	return getTimeSeriesIntervalFields( rawPeriod, unit );
}

function getTimeSeriesSummarySidecars( response: StatsRecord ) {
	return {
		...normalizeStatsSummary( coerceStatsRecord( response.summary ) ),
		...normalizeStatsSummary( coerceStatsRecord( response.opens_rate ) ),
		...normalizeStatsSummary( coerceStatsRecord( response.clicks_rate ) ),
		...normalizeStatsSummary( coerceStatsRecord( response.rate ) ),
	};
}

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
	const rows = parseTimeSeriesRows( payload );
	const summary = rows.reduce< Record< string, number > >( ( totals, row ) => {
		Object.entries( row ).forEach( ( [ key, value ] ) => {
			if ( ! nonMetricFields.includes( key ) && typeof value === 'number' ) {
				totals[ key ] = ( totals[ key ] ?? 0 ) + value;
			}
		} );

		return totals;
	}, {} );
	const data = rows.map< StatsTimeSeriesDataPoint >( row => {
		const rawPeriod = row.period ?? row.time_interval ?? row.date_start ?? row.date;
		const range = getRowIntervalFields( row, rawPeriod, unit );
		const value = safeParseFloat( getPrimaryMetricValue( row ) );

		return {
			...row,
			...range,
			label: range.time_interval,
			value,
			items: [],
		};
	} );
	const firstRow = data[ 0 ];
	const lastRow = data[ data.length - 1 ];

	return {
		summary: {
			...getTimeSeriesSummarySidecars( response ),
			...summary,
			date_start: firstRow?.date_start ?? query?.start_date ?? '',
			date_end: lastRow?.date_end ?? query?.end_date ?? query?.date ?? '',
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

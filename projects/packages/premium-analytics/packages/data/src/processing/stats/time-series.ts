import {
	formatDatePartWithTime,
	getDatePart,
	parseExactLabel,
	readSiteTimestamp,
	toBucketStamp,
} from '@jetpack-premium-analytics/datetime';
import {
	endOfISOWeek,
	endOfMonth,
	endOfYear,
	format,
	startOfISOWeek,
	startOfMonth,
	startOfYear,
} from 'date-fns';
import { safeParseFloat } from '../../utils/parsing';
import {
	createStatsBucketWindowFilter,
	isWallClockStamp,
	type StatsBucketFilter,
} from './bucket-window';
import {
	coerceStatsArray,
	coerceStatsRecord,
	DAY_END_TIME,
	DAY_START_TIME,
	getStatsIntervalFields,
	normalizeStatsSummary,
} from './utils';
import type {
	StatsIntervalFields,
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
		date_start: formatDatePartWithTime( format( startDate, dateFormat ), DAY_START_TIME ),
		date_end: formatDatePartWithTime( format( endDate, dateFormat ), DAY_END_TIME ),
	};
}

function getWeekIntervalFields( period: string ) {
	const match = period.match( /^(\d{4})-?W?(\d{1,2})$/ );

	if ( ! match ) {
		return null;
	}

	const normalizedPeriod = `${ match[ 1 ] }-W${ match[ 2 ].padStart( 2, '0' ) }`;
	const parsed = parseExactLabel( normalizedPeriod, "RRRR-'W'II" );

	if ( ! parsed ) {
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

	const parsed = parseExactLabel( `${ match[ 1 ] }-${ match[ 2 ] }-${ match[ 3 ] }`, dateFormat );

	if ( ! parsed ) {
		return null;
	}

	return getDateFnsIntervalFields( startOfISOWeek( parsed ), endOfISOWeek( parsed ) );
}

function getMonthIntervalFields( period: string ) {
	const parsed = parseExactLabel( period, 'yyyy-MM' );

	if ( ! parsed ) {
		return null;
	}

	return getDateFnsIntervalFields( startOfMonth( parsed ), endOfMonth( parsed ) );
}

function getYearIntervalFields( period: string ) {
	const parsed = parseExactLabel( period, 'yyyy' );

	if ( ! parsed ) {
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

	// Like getStatsIntervalFields, these are timezone-naive site-local bucket labels, so
	// no offset is stamped for a consumer to convert across.
	return {
		time_interval: `${ datePart } ${ hourPart }:00`,
		date_start: formatDatePartWithTime( datePart, `${ hourPart }:00:00` ),
		date_end: formatDatePartWithTime( datePart, `${ hourPart }:59:59` ),
	};
}

// `stats/visits` packs an hourly bucket's date and hour into a single `period`,
// where the email timeline carries the hour in its own column.
const packedHourlyPeriod = /^(\d{4}-\d{2}-\d{2})[T ](\d{2})/;

type HourlyLabelZones = { labelOffset: string; zone: string };

// A request that states an offset gets every hourly label in that one fixed offset,
// DST or not, so a transition day's labels must be read back into the site's zone.
function getHourlyLabelZones(
	response: StatsRecord,
	query?: StatsQueryParams
): HourlyLabelZones | undefined {
	const statesOffset = [ query?.date, query?.start_date ].some(
		value => typeof value === 'string' && !! readSiteTimestamp( value )?.offset
	);

	return statesOffset && typeof response.utc_offset === 'string' && query?.timezone
		? { labelOffset: response.utc_offset, zone: query.timezone }
		: undefined;
}

function getPackedHourIntervalFields( date: string, hour: string, zones?: HourlyLabelZones ) {
	const local = zones
		? toBucketStamp( `${ date }T${ hour }:00:00${ zones.labelOffset }`, zones.zone ).match(
				packedHourlyPeriod
			)
		: null;

	return local
		? getHourIntervalFields( local[ 1 ], local[ 2 ] )
		: getHourIntervalFields( date, hour );
}

function getRowIntervalFields(
	row: StatsRecord,
	rawPeriod: unknown,
	unit: string,
	zones?: HourlyLabelZones
) {
	if ( unit === 'hour' && row.hour !== undefined && typeof rawPeriod === 'string' ) {
		return getHourIntervalFields( rawPeriod, row.hour );
	}

	if ( unit === 'hour' && typeof rawPeriod === 'string' ) {
		const packed = rawPeriod.match( packedHourlyPeriod );

		if ( packed ) {
			return getPackedHourIntervalFields( packed[ 1 ], packed[ 2 ], zones );
		}
	}

	return getTimeSeriesIntervalFields( rawPeriod, unit );
}

type TimeSeriesBucket = { row: StatsRecord; range: StatsIntervalFields };

function sumMetrics( row: StatsRecord, other: StatsRecord ): StatsRecord {
	return Object.fromEntries(
		Object.entries( row ).map( ( [ key, value ] ) => {
			const addend = other[ key ];

			return [
				key,
				! nonMetricFields.includes( key ) && typeof value === 'number' && typeof addend === 'number'
					? value + addend
					: ( value ?? addend ),
			];
		} )
	);
}

// A fall-back day repeats an hour, which the chart could only draw as two points on one instant.
function mergeRepeatedHours( buckets: TimeSeriesBucket[] ): TimeSeriesBucket[] {
	const byStart = new Map< string, TimeSeriesBucket >();

	buckets.forEach( bucket => {
		const seen = byStart.get( bucket.range.date_start );

		byStart.set(
			bucket.range.date_start,
			seen ? { ...seen, row: sumMetrics( seen.row, bucket.row ) } : bucket
		);
	} );

	return [ ...byStart.values() ];
}

// Rows stamp their bounds as timezone-naive wall times, so the query's own offset
// cannot be passed through verbatim — it would be converted, not read as a label.
function toRangeBound( value: string | undefined, time: string ) {
	const datePart = getDatePart( value );

	return datePart ? formatDatePartWithTime( datePart, time ) : '';
}

// Units whose edge buckets the range cuts through are stamped with its edges, so
// no bucket claims a day outside it (UNI-842, STATS-551, STATS-554). A cut month or
// year sits nearer its neighbour, so its chart must pass `tickResolution`, not infer it.
const CLIPPED_UNITS = new Set( [ 'week', 'month', 'year' ] );

function clipToRange(
	range: StatsIntervalFields,
	start: string,
	end: string
): StatsIntervalFields {
	if ( ! isWallClockStamp( range.date_start ) || ! isWallClockStamp( range.date_end ) ) {
		return range;
	}

	return {
		...range,
		date_start: start && range.date_start < start ? start : range.date_start,
		date_end: end && range.date_end > end ? end : range.date_end,
	};
}

function getTimeSeriesSummarySidecars( response: StatsRecord ) {
	return {
		...normalizeStatsSummary( coerceStatsRecord( response.summary ) ),
		...normalizeStatsSummary( coerceStatsRecord( response.opens_rate ) ),
		...normalizeStatsSummary( coerceStatsRecord( response.clicks_rate ) ),
		...normalizeStatsSummary( coerceStatsRecord( response.rate ) ),
	};
}

export function sanitizeStatsTimeSeriesResponse(
	payload: unknown,
	query?: StatsQueryParams,
	keepBucket?: StatsBucketFilter
): StatsTimeSeriesReport {
	const response = coerceStatsRecord( payload );
	const unit = String( response.unit ?? query?.period ?? 'day' );
	const rangeStart = toRangeBound( query?.start_date, DAY_START_TIME );
	const rangeEnd = toRangeBound( query?.end_date ?? query?.date, DAY_END_TIME );
	const zones = unit === 'hour' ? getHourlyLabelZones( response, query ) : undefined;
	const parsed = parseTimeSeriesRows( payload ).map( row => {
		const rawPeriod = row.period ?? row.time_interval ?? row.date_start ?? row.date;
		const range = getRowIntervalFields( row, rawPeriod, unit, zones );

		return {
			row,
			range: CLIPPED_UNITS.has( unit ) ? clipToRange( range, rangeStart, rangeEnd ) : range,
		};
	} );
	const buckets = unit === 'hour' ? mergeRepeatedHours( parsed ) : parsed;
	// Filter before the summary, so dropped buckets inflate neither the totals nor
	// the chart. Only an endpoint-specific sanitizer supplies a filter.
	const kept = keepBucket ? buckets.filter( ( { range } ) => keepBucket( range ) ) : buckets;
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
		// first, but everything downstream reads `data[0]` as the oldest.
		.sort( ( a, b ) => compareBucketBounds( a.date_start, b.date_start ) );
	const firstRow = data[ 0 ];
	const lastRow = data[ data.length - 1 ];

	return {
		summary: {
			...getTimeSeriesSummarySidecars( response ),
			...summary,
			date_start: firstRow?.date_start ?? rangeStart,
			date_end: lastRow?.date_end ?? rangeEnd,
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

	// Names an unlabeled trailing hour column so older/alternate payloads still
	// resolve into per-hour buckets (matching Calypso's parseEmailChartData).
	const normalizedTimeline =
		timeline.unit === 'hour' && fields.length && ! fields.includes( 'hour' )
			? { ...timeline, fields: [ ...fields, 'hour' ] }
			: timeline;

	// The email timeline is quantity-based and midnight-anchored, so its
	// query opts into the bucket-window trim (see bucket-window.ts).
	return sanitizeStatsTimeSeriesResponse(
		normalizedTimeline,
		query,
		createStatsBucketWindowFilter( query )
	);
}

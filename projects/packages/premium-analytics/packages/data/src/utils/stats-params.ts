/**
 * Internal dependencies
 */
import type { ReportParams } from './search';
import type { StatsProxyParams } from '../api/stats-proxy-fetch';

export type StatsPeriod = 'hour' | 'day' | 'week' | 'month' | 'year';

export type StatsQueryParams = StatsProxyParams & {
	period?: StatsPeriod | string;
	date?: string;
	start_date?: string;
	days?: number;
	num?: number;
	max?: number;
	summarize?: number | boolean;
};

type StatsQueryParamInput = Partial< ReportParams > & {
	period?: StatsPeriod | string;
	date?: string;
	start_date?: string;
	days?: number;
	num?: number;
	max?: number;
	summarize?: number | boolean;
	[ key: string ]: unknown;
};

function datePart( value?: string ) {
	return value?.split( 'T' )[ 0 ];
}

function daysBetweenInclusive( from: string, to: string ) {
	const fromDate = new Date( `${ from }T00:00:00Z` );
	const toDate = new Date( `${ to }T00:00:00Z` );
	const diff = toDate.getTime() - fromDate.getTime();

	if ( Number.isNaN( diff ) || diff < 0 ) {
		// Keep the Stats API request bounded even when callers pass an invalid range.
		return 1;
	}

	return Math.floor( diff / 86400000 ) + 1;
}

export function getStatsPeriodFromInterval( interval?: string ): StatsPeriod {
	switch ( interval ) {
		case 'hour':
			return 'hour';
		case 'week':
			return 'week';
		case 'month':
		case 'quarter':
			return 'month';
		case 'year':
			return 'year';
		case 'day':
		default:
			return 'day';
	}
}

export function reportParamsToStatsQueryParams(
	params: StatsQueryParamInput = {}
): StatsQueryParams {
	const statsParams = { ...params };
	const reportOnlyKeys = [
		'from',
		'to',
		'interval',
		'preset',
		'compare_from',
		'compare_to',
		'compare_preset',
		'comp',
		'filters',
		'section',
		'date_type',
		'view',
		'geoMode',
		'utmParams',
		'deviceProperty',
	] as const;

	reportOnlyKeys.forEach( key => {
		delete statsParams[ key ];
	} );

	const from = datePart( params.from );
	const to = datePart( params.to );
	const period = params.period ?? getStatsPeriodFromInterval( params.interval );
	const date = params.date ?? to;
	const startDate = params.start_date ?? from;
	const days =
		params.days ?? ( startDate && date ? daysBetweenInclusive( startDate, date ) : undefined );

	return {
		...( statsParams as StatsQueryParams ),
		period,
		...( date ? { date } : {} ),
		...( startDate ? { start_date: startDate } : {} ),
		...( days ? { days } : {} ),
	};
}

function normalizeQueryKeyValue( value: unknown ): unknown {
	if ( Array.isArray( value ) ) {
		return value.map( normalizeQueryKeyValue );
	}

	if ( value && typeof value === 'object' ) {
		return Object.fromEntries(
			Object.entries( value )
				.filter( ( [ , item ] ) => item !== undefined && item !== null )
				.sort( ( [ a ], [ b ] ) => a.localeCompare( b ) )
				.map( ( [ key, item ] ) => [ key, normalizeQueryKeyValue( item ) ] )
		);
	}

	return value;
}

export function statsQueryKeyPart( params?: unknown ) {
	if ( params === undefined || params === null ) {
		return '';
	}

	return JSON.stringify( normalizeQueryKeyValue( params ) );
}

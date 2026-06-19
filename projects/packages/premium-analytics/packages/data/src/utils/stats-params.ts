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
	return value?.split( 'T' )[ 0 ] ?? '';
}

function daysBetweenInclusive( from: string, to: string ) {
	const fromDate = new Date( `${ from }T00:00:00Z` );
	const toDate = new Date( `${ to }T00:00:00Z` );
	const diff = toDate.getTime() - fromDate.getTime();

	if ( Number.isNaN( diff ) || diff < 0 ) {
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
	delete statsParams.from;
	delete statsParams.to;
	delete statsParams.interval;
	delete statsParams.preset;
	delete statsParams.compare_from;
	delete statsParams.compare_to;
	delete statsParams.compare_preset;
	delete statsParams.comp;
	delete statsParams.filters;
	delete statsParams.section;
	delete statsParams.date_type;
	delete statsParams.view;

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
		date,
		start_date: startDate,
		...( days ? { days } : {} ),
		num: params.num ?? 1,
		max: params.max ?? 10,
	};
}

export function statsQueryKeyPart( params?: StatsProxyParams ) {
	if ( ! params ) {
		return '';
	}

	const normalized = Object.entries( params )
		.filter( ( [ , value ] ) => value !== undefined && value !== null )
		.sort( ( [ a ], [ b ] ) => a.localeCompare( b ) );

	return JSON.stringify( normalized );
}

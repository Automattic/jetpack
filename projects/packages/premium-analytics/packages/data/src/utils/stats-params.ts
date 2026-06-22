/**
 * Internal dependencies
 */
import { getDaysBetweenInclusive } from './interval';
import type { ReportParams } from './search';
import type { StatsProxyParams } from '../api/stats-proxy-fetch';

export type StatsPeriod = 'hour' | 'day' | 'week' | 'month' | 'year';

type StatsQueryParamFields = {
	period?: StatsPeriod | string;
	date?: string;
	start_date?: string;
	days?: number;
	num?: number;
	max?: number;
	summarize?: number | boolean;
};

export type StatsQueryParams = StatsProxyParams & StatsQueryParamFields;

type StatsQueryParamInput = Partial< ReportParams > & {
	[ key: string ]: unknown;
} & Partial< StatsQueryParamFields >;

type ReportOnlyParam = keyof ReportParams | 'geoMode' | 'utmParams' | 'deviceProperty';

const reportOnlyKeys: ReportOnlyParam[] = [
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
];

function datePart( value?: string ) {
	return value?.split( 'T' )[ 0 ];
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

	reportOnlyKeys.forEach( key => {
		delete statsParams[ key ];
	} );

	const from = datePart( params.from );
	const to = datePart( params.to );
	const period = params.period ?? getStatsPeriodFromInterval( params.interval );
	const date = params.date ?? to;
	const startDate = params.start_date ?? from;
	const days =
		params.days ?? ( startDate && date ? getDaysBetweenInclusive( startDate, date ) : undefined );

	return {
		...( statsParams as StatsQueryParams ),
		period,
		...( date ? { date } : {} ),
		...( startDate ? { start_date: startDate } : {} ),
		...( days ? { days } : {} ),
	};
}

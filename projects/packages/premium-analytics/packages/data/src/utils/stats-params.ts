/**
 * External dependencies
 */
import { formatToTimezoneNaiveString } from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import { getSiteTimezone, localTZDate } from './date';
import { getDaysBetweenInclusive } from './interval';
import type { ReportParams } from './search';
import type { StatsProxyParams } from '../api/stats-proxy-fetch';

export type StatsPeriod = 'hour' | 'day' | 'week' | 'month' | 'year';

type StatsQueryParamFields = {
	period?: StatsPeriod | string;
	end_date?: string;
	date?: string;
	start_date?: string;
	days?: number;
	num?: number;
	max?: number;
	summarize?: number | boolean;
	complete_stats?: number | boolean;
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

function hasTimeZoneDesignator( value: string ): boolean {
	const timePart = value.split( 'T' )[ 1 ] ?? '';
	return /[zZ]|[+-]\d{2}:?\d{2}$/.test( timePart );
}

/*
 * The Stats backend interprets date boundaries in the site's timezone, so a full ISO `from` / `to`
 * has to be resolved to the matching calendar day in that timezone before it is reduced to a date.
 * Date-only and timezone-naive inputs already carry the intended calendar day, so they pass through
 * verbatim; only offset-bearing inputs (`Z` / `±hh:mm`) need conversion.
 */
function toSiteCalendarDate( value: string | undefined, timezone: string ): string | undefined {
	if ( ! value ) {
		return undefined;
	}

	if ( ! hasTimeZoneDesignator( value ) ) {
		return value.split( 'T' )[ 0 ];
	}

	return formatToTimezoneNaiveString( localTZDate( value, timezone ), timezone ).split( 'T' )[ 0 ];
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
	params: StatsQueryParamInput = {},
	timezone?: string
): StatsQueryParams {
	const tz = timezone ?? getSiteTimezone();
	const statsParams = { ...params };

	reportOnlyKeys.forEach( key => {
		delete statsParams[ key ];
	} );

	const from = toSiteCalendarDate( params.from, tz );
	const to = toSiteCalendarDate( params.to, tz );
	const period = params.period ?? getStatsPeriodFromInterval( params.interval );
	const endDate = params.end_date ?? params.date ?? to;
	const startDate = params.start_date ?? from;
	const days =
		params.days ??
		( startDate && endDate ? getDaysBetweenInclusive( startDate, endDate ) : undefined );

	return {
		...( statsParams as StatsQueryParams ),
		period,
		...( endDate ? { end_date: endDate } : {} ),
		...( startDate ? { start_date: startDate } : {} ),
		...( days ? { days } : {} ),
	};
}

export function statsQueryParamsToApiParams( params: StatsQueryParams = {} ): StatsProxyParams {
	const { end_date: endDate, ...apiParams } = params;

	return {
		...apiParams,
		...( endDate ? { date: endDate } : {} ),
	};
}

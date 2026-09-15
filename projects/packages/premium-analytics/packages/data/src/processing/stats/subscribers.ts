import { sanitizeStatsTimeSeriesResponse } from './time-series';
import { coerceStatsRecord } from './utils';
import type { StatsNormalizedDataPoint, StatsNormalizedReport } from './types';
import type { StatsQueryParams } from '../../utils/stats-params';

export type StatsSubscribersRawResponse = {
	date?: string;
	unit?: string;
	fields?: string[];
	data?: Array< Array< string | number | null > >;
};

export type StatsSubscribersDataPoint = StatsNormalizedDataPoint & {
	value: number;
	subscribers?: number;
	subscribers_paid?: number;
};

export type StatsSubscribersResponse = StatsNormalizedReport & {
	data: StatsSubscribersDataPoint[];
};

export type StatsSubscribersCounts = {
	total_subscribers?: number;
	email_subscribers?: number;
	paid_subscribers?: number;
	social_followers?: number;
};

export type StatsSubscribersCountsRawResponse = {
	counts?: StatsSubscribersCounts;
};

const countFields = [
	'total_subscribers',
	'email_subscribers',
	'paid_subscribers',
	'social_followers',
] as const satisfies ReadonlyArray< keyof StatsSubscribersCounts >;

function normalizeCountValue( value: unknown ) {
	return typeof value === 'number' ? value : undefined;
}

export function sanitizeStatsSubscribersResponse(
	response: StatsSubscribersRawResponse,
	query?: StatsQueryParams
): StatsSubscribersResponse;
export function sanitizeStatsSubscribersResponse(
	response: unknown,
	query?: StatsQueryParams
): StatsSubscribersResponse {
	return sanitizeStatsTimeSeriesResponse( response, query ) as StatsSubscribersResponse;
}

export function sanitizeStatsSubscribersCountsResponse(
	response: StatsSubscribersCountsRawResponse
): StatsSubscribersCounts;
export function sanitizeStatsSubscribersCountsResponse(
	response: unknown
): StatsSubscribersCounts {
	const counts = coerceStatsRecord( coerceStatsRecord( response ).counts );

	return Object.fromEntries(
		countFields.map( field => [ field, normalizeCountValue( counts[ field ] ) ] )
	) as StatsSubscribersCounts;
}

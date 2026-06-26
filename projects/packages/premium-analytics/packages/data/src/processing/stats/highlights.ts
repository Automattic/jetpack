import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsRecord } from './utils';
import type { StatsRecord } from './types';

type StatsHighlightsMetricValue = number | string;

export type StatsHighlightsRawRange = {
	start: string;
	end: string;
};

export type StatsHighlightsRawPeriod = {
	range: StatsHighlightsRawRange;
	comments: StatsHighlightsMetricValue;
	likes: StatsHighlightsMetricValue;
	views: StatsHighlightsMetricValue;
	visitors: StatsHighlightsMetricValue;
};

export type StatsHighlightsRawResponse = Record< string, StatsHighlightsRawPeriod >;

export type StatsHighlightsRange = {
	start: string;
	end: string;
};

export type StatsHighlightsPeriod = {
	range: StatsHighlightsRange;
	comments: number;
	likes: number;
	views: number;
	visitors: number;
};

export type StatsHighlightsResponse = Record< string, StatsHighlightsPeriod >;

function getString( value: unknown ) {
	return typeof value === 'string' ? value : '';
}

function normalizeStatsHighlightsPeriod( value: StatsRecord ): StatsHighlightsPeriod {
	const range = coerceStatsRecord( value.range );

	return {
		range: {
			start: getString( range.start ),
			end: getString( range.end ),
		},
		comments: safeParseFloat( value.comments ),
		likes: safeParseFloat( value.likes ),
		views: safeParseFloat( value.views ),
		visitors: safeParseFloat( value.visitors ),
	};
}

export function sanitizeStatsHighlightsResponse( response: unknown ): StatsHighlightsResponse {
	return Object.fromEntries(
		Object.entries( coerceStatsRecord( response ) ).map( ( [ key, value ] ) => [
			key,
			normalizeStatsHighlightsPeriod( coerceStatsRecord( value ) ),
		] )
	);
}

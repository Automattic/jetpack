import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsRecord } from './utils';

/**
 * The Stats `summary` endpoint returns a single flat object of period totals for
 * the requested window (not a time series). `date`/`period` echo the request;
 * the counts are the aggregated values over the period, except `followers`,
 * which is the site's running follower total at that date.
 */
export type StatsSummaryResponse = {
	date: string;
	period: string;
	views: number;
	visitors: number;
	likes: number;
	reblogs: number;
	comments: number;
	followers: number;
};

function getString( value: unknown ) {
	return typeof value === 'string' ? value : '';
}

export function sanitizeStatsSummaryResponse( response: unknown ): StatsSummaryResponse {
	const payload = coerceStatsRecord( response );

	return {
		date: getString( payload.date ),
		period: getString( payload.period ),
		views: safeParseFloat( payload.views ),
		visitors: safeParseFloat( payload.visitors ),
		likes: safeParseFloat( payload.likes ),
		reblogs: safeParseFloat( payload.reblogs ),
		comments: safeParseFloat( payload.comments ),
		followers: safeParseFloat( payload.followers ),
	};
}

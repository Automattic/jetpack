/**
 * Internal dependencies
 */
import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsArray, coerceStatsRecord } from './utils';

export type StatsTopAiUrl = {
	/** The requested URL as the edge logs keep it, without its query string. */
	url: string;
	requests: number;
};

export type StatsTopAiUrlsReport = {
	/** Most requests first. */
	data: StatsTopAiUrl[];
};

/**
 * Normalize a `top-ai-urls` answer of `stats/ua-queries`, one `{ url, ai_requests }` row per URL.
 *
 * @param response - The endpoint's rows.
 * @return The URLs AI bots requested.
 */
export function sanitizeStatsTopAiUrlsResponse( response: unknown ): StatsTopAiUrlsReport {
	return {
		data: coerceStatsArray( response )
			.map( item => {
				const row = coerceStatsRecord( item );
				return { url: String( row.url ?? '' ), requests: safeParseFloat( row.ai_requests ) };
			} )
			.filter( row => row.url )
			.sort( ( a, b ) => b.requests - a.requests ),
	};
}

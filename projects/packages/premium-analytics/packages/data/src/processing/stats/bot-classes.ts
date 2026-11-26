/**
 * Internal dependencies
 */
import { safeParseFloat } from '../../utils/parsing';
import { AI_PROVIDER_UNKNOWN } from './ai-providers';
import { coerceStatsArray, coerceStatsRecord } from './utils';

export type StatsBotClassItem = {
	/** The edge's class for the bot, e.g. "AI Data Scraper" or "Search Engine Crawler". */
	trafficClass: string;
	/** The bot, or `AI_PROVIDER_UNKNOWN` when the edge could not name it. */
	botName: string;
	requests: number;
};

export type StatsBotClassesReport = {
	/** Most requests first. */
	data: StatsBotClassItem[];
};

/**
 * Normalize a `bot-class-and-name` answer of `stats/ua-queries`.
 *
 * The template returns one row per class and bot, as
 * `{ traffic_class, bot_name, total, class_pct, bot_pct }`. The percentages are left
 * out: each is computed within one `bot_category`, so they cannot be compared
 * across the two requests a reader of every bot makes.
 *
 * @param response - The endpoint's rows.
 * @return The bots, most requests first.
 */
export function sanitizeStatsBotClassesResponse( response: unknown ): StatsBotClassesReport {
	return {
		data: coerceStatsArray( response )
			.map( item => {
				const row = coerceStatsRecord( item );

				return {
					trafficClass: String( row.traffic_class ?? '' ) || AI_PROVIDER_UNKNOWN,
					botName: String( row.bot_name ?? '' ) || AI_PROVIDER_UNKNOWN,
					requests: safeParseFloat( row.total ),
				};
			} )
			.sort( ( a, b ) => b.requests - a.requests ),
	};
}

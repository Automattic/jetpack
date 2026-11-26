/**
 * Internal dependencies
 */
import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsArray, coerceStatsRecord } from './utils';

export type StatsBotActivityBot = {
	/** The bot, or `AI_PROVIDER_UNKNOWN` when the edge could not name it. */
	name: string;
	requests: number;
};

export type StatsBotActivityGroup = {
	/** The template's stable group key, e.g. `ai_training`. */
	key: string;
	/** Every bot in the group, including those past the bots returned. */
	requests: number;
	/** Its top bots, most requests first. */
	bots: StatsBotActivityBot[];
};

export type StatsBotActivityReport = {
	/** In the template's display order. */
	data: StatsBotActivityGroup[];
};

/**
 * Nest a `bot-activity` answer of `stats/ua-queries` into its groups.
 *
 * The template returns one row per group and bot, as `{ bot_group, group_order,
 * bot_name, total, group_total, … }`, in display order and then by requests.
 *
 * @param response - The endpoint's rows.
 * @return The groups in display order, each with its bots.
 */
export function sanitizeStatsBotActivityResponse( response: unknown ): StatsBotActivityReport {
	const groups = new Map< string, StatsBotActivityGroup >();

	for ( const item of coerceStatsArray( response ) ) {
		const row = coerceStatsRecord( item );
		const key = String( row.bot_group ?? '' );
		const group = groups.get( key ) ?? {
			key,
			requests: safeParseFloat( row.group_total ),
			bots: [],
		};

		group.bots.push( {
			name: String( row.bot_name ?? '' ),
			requests: safeParseFloat( row.total ),
		} );
		groups.set( key, group );
	}

	return { data: [ ...groups.values() ] };
}

/**
 * Internal dependencies
 */
import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsArray, coerceStatsRecord, mergeStatsComparisonRows } from './utils';

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

export type StatsBotActivityComparisonBot = StatsBotActivityBot & {
	/** Requests in the comparison period; `undefined` when the bot is not in that period's top bots. */
	previousValue?: number;
};

export type StatsBotActivityComparisonGroup = Omit< StatsBotActivityGroup, 'bots' > & {
	/** Requests in the comparison period; `undefined` when the group had none. */
	previousValue?: number;
	bots: StatsBotActivityComparisonBot[];
	/** Whether any of its bots has a comparison value. */
	botsHaveComparison: boolean;
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

/**
 * Pair each group, and each of its bots, with the comparison period's figure.
 *
 * Groups match on their key and bots on their name, within their group. A bot the comparison
 * period did not return among its top bots has no previous value, even if it had requests.
 *
 * @param primaryReport    - The selected period.
 * @param comparisonReport - The comparison period, if one was fetched.
 * @return The groups in the selected period's order, and whether any has a previous value.
 */
export function mergeStatsBotActivityComparisonRows(
	primaryReport: StatsBotActivityReport | undefined,
	comparisonReport: StatsBotActivityReport | undefined
): { rows: StatsBotActivityComparisonGroup[]; hasComparison: boolean } {
	return mergeStatsComparisonRows<
		StatsBotActivityGroup,
		StatsBotActivityGroup,
		StatsBotActivityComparisonGroup
	>( {
		primaryRows: primaryReport?.data ?? [],
		comparisonRows: comparisonReport?.data ?? [],
		getPrimaryKey: group => group.key,
		getComparisonKey: group => group.key,
		getComparisonValue: group => group.requests,
		mapRow: ( group, { previousValue, comparisonItem } ) => {
			const bots = mergeStatsComparisonRows<
				StatsBotActivityBot,
				StatsBotActivityBot,
				StatsBotActivityComparisonBot
			>( {
				primaryRows: group.bots,
				comparisonRows: comparisonItem?.bots ?? [],
				getPrimaryKey: bot => bot.name,
				getComparisonKey: bot => bot.name,
				getComparisonValue: bot => bot.requests,
				mapRow: ( bot, context ) => ( { ...bot, previousValue: context.previousValue } ),
			} );

			return {
				...group,
				previousValue,
				bots: bots.rows,
				botsHaveComparison: bots.hasComparison,
			};
		},
	} );
}

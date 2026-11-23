/**
 * Internal dependencies
 */
import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsArray, coerceStatsRecord } from './utils';

/** The name the template gives a bot or a company the edge could not name. */
export const AI_PROVIDER_UNKNOWN = 'Unknown';

export type StatsAiProviderBot = {
	name: string;
	/** The edge's class for the bot, e.g. "AI Crawler"; empty when it has none. */
	type: string;
	requests: number;
};

export type StatsAiProvider = {
	/** The company, or `AI_PROVIDER_UNKNOWN` for bots with no known owner. */
	name: string;
	requests: number;
	/** Its bots, most requests first. */
	bots: StatsAiProviderBot[];
};

export type StatsAiProvidersReport = {
	/** Most requests first. */
	data: StatsAiProvider[];
};

/**
 * Group an `ai-providers-with-drill` answer of `stats/ua-queries` by company.
 *
 * The template returns one row per bot, as `{ bot_owner, bot_name, bot_type, total }`.
 *
 * @param response - The endpoint's rows.
 * @return The companies, each with its bots.
 */
export function sanitizeStatsAiProvidersResponse( response: unknown ): StatsAiProvidersReport {
	const providers = new Map< string, StatsAiProvider >();

	for ( const item of coerceStatsArray( response ) ) {
		const row = coerceStatsRecord( item );
		const name = String( row.bot_owner ?? '' ) || AI_PROVIDER_UNKNOWN;
		const requests = safeParseFloat( row.total );
		const provider = providers.get( name ) ?? { name, requests: 0, bots: [] };

		provider.requests += requests;
		provider.bots.push( {
			name: String( row.bot_name ?? '' ) || AI_PROVIDER_UNKNOWN,
			type: String( row.bot_type ?? '' ),
			requests,
		} );
		providers.set( name, provider );
	}

	const byRequests = ( a: { requests: number }, b: { requests: number } ) =>
		b.requests - a.requests;

	return {
		data: [ ...providers.values() ]
			.map( provider => ( { ...provider, bots: [ ...provider.bots ].sort( byRequests ) } ) )
			.sort( byRequests ),
	};
}

/**
 * External dependencies
 */
import { AI_PROVIDER_UNKNOWN, type StatsBotClassItem } from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
import type { LeaderboardRowInput } from '@jetpack-premium-analytics/widgets-toolkit';

type BotGroupId =
	'ai-training' | 'ai-search' | 'ai-assistants' | 'search-engines' | 'other-known' | 'unidentified';

function groupLabel( id: BotGroupId ): string {
	switch ( id ) {
		case 'ai-training':
			return __( 'AI training', 'jetpack-premium-analytics-pkg' );
		case 'ai-search':
			return __( 'AI search', 'jetpack-premium-analytics-pkg' );
		case 'ai-assistants':
			return __( 'AI assistants & agents', 'jetpack-premium-analytics-pkg' );
		case 'search-engines':
			return __( 'Search engines', 'jetpack-premium-analytics-pkg' );
		case 'other-known':
			return __( 'Other known bots', 'jetpack-premium-analytics-pkg' );
		case 'unidentified':
			return __( 'Unidentified bots', 'jetpack-premium-analytics-pkg' );
	}
}

// Until `bot-class-and-name` returns these groups itself (DLINK-570).
const GROUP_BY_TRAFFIC_CLASS: Record< string, BotGroupId > = {
	'AI Data Scraper': 'ai-training',
	'AI Search Crawler': 'ai-search',
	'AI Assistant': 'ai-assistants',
	'AI Agent': 'ai-assistants',
	'Search Engine Crawler': 'search-engines',
};

function groupOf( item: StatsBotClassItem ): BotGroupId {
	// The edge files the bots it cannot tell apart under one name, inside its `Bot` class.
	if ( item.botName === 'Generic Bot' ) {
		return 'unidentified';
	}

	return GROUP_BY_TRAFFIC_CLASS[ item.trafficClass ] ?? 'other-known';
}

/**
 * The rows of the Bot activity list: one per group with bots, most requests first,
 * each opening onto its bots.
 *
 * A bot the edge files under two classes of one group counts once, with both counts.
 *
 * @param items - The bots of both halves of `bot-class-and-name`, AI and the rest.
 * @return The rows.
 */
export function buildBotGroupRows( items: readonly StatsBotClassItem[] ): LeaderboardRowInput[] {
	const groups = new Map< BotGroupId, Map< string, number > >();

	for ( const item of items ) {
		const id = groupOf( item );
		const bots = groups.get( id ) ?? new Map< string, number >();

		bots.set( item.botName, ( bots.get( item.botName ) ?? 0 ) + item.requests );
		groups.set( id, bots );
	}

	return [ ...groups ]
		.map( ( [ id, bots ] ) => ( {
			id,
			label: groupLabel( id ),
			value: [ ...bots.values() ].reduce( ( sum, requests ) => sum + requests, 0 ),
			children: [ ...bots ]
				.sort( ( a, b ) => b[ 1 ] - a[ 1 ] )
				.map( ( [ name, requests ] ) => ( {
					id: `${ id }/${ name }`,
					label:
						name === AI_PROVIDER_UNKNOWN
							? __( 'Unnamed bots', 'jetpack-premium-analytics-pkg' )
							: name,
					value: requests,
				} ) ),
		} ) )
		.sort( ( a, b ) => b.value - a.value );
}

/**
 * External dependencies
 */
import {
	AI_PROVIDER_UNKNOWN,
	type StatsBotActivityComparisonGroup,
} from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
import type { LeaderboardRowInput } from '@jetpack-premium-analytics/widgets-toolkit';

function groupLabel( key: string ): string {
	switch ( key ) {
		case 'ai_training':
			return __( 'AI training', 'jetpack-premium-analytics-pkg' );
		case 'ai_search':
			return __( 'AI search', 'jetpack-premium-analytics-pkg' );
		case 'ai_assistants_agents':
			return __( 'AI assistants & agents', 'jetpack-premium-analytics-pkg' );
		case 'search_engines':
			return __( 'Search engines', 'jetpack-premium-analytics-pkg' );
		case 'other_known':
			return __( 'Other known bots', 'jetpack-premium-analytics-pkg' );
		case 'unidentified':
			return __( 'Unidentified bots', 'jetpack-premium-analytics-pkg' );
		default:
			// A group the template added after this release, named from its key until it gets a label here.
			return key.charAt( 0 ).toUpperCase() + key.slice( 1 ).replace( /_/g, ' ' );
	}
}

/**
 * The rows of the Bot activity list: one per group, in the template's order, each
 * opening onto its top bots, with the comparison period's figures when there are any.
 *
 * @param groups - The groups of the `bot-activity` template.
 * @return The rows.
 */
export function buildBotGroupRows(
	groups: readonly StatsBotActivityComparisonGroup[]
): LeaderboardRowInput[] {
	return groups.map( group => ( {
		id: group.key,
		label: groupLabel( group.key ),
		value: group.requests,
		previousValue: group.previousValue,
		childrenHaveComparison: group.botsHaveComparison,
		children: group.bots.map( bot => ( {
			id: `${ group.key }/${ bot.name }`,
			label:
				bot.name === AI_PROVIDER_UNKNOWN
					? __( 'Unnamed bots', 'jetpack-premium-analytics-pkg' )
					: bot.name,
			value: bot.requests,
			previousValue: bot.previousValue,
		} ) ),
	} ) );
}

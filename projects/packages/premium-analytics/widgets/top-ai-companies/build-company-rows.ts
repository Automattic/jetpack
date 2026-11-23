/**
 * External dependencies
 */
import { AI_PROVIDER_UNKNOWN, type StatsAiProvider } from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
import type { LeaderboardRowInput } from '@jetpack-premium-analytics/widgets-toolkit';

function toCompanyRow( provider: StatsAiProvider ): LeaderboardRowInput {
	return {
		id: provider.name,
		label: provider.name,
		value: provider.requests,
		children: provider.bots.map( bot => ( {
			id: `${ provider.name }/${ bot.name }`,
			label:
				bot.name === AI_PROVIDER_UNKNOWN
					? __( 'Unnamed bots', 'jetpack-premium-analytics-pkg' )
					: bot.name,
			value: bot.requests,
		} ) ),
	};
}

/**
 * The rows of the Top AI companies list: the companies with the most requests, the
 * rest folded into one row, and the bots nobody owns last.
 *
 * @param providers - The companies, most requests first.
 * @param maxRows   - Rows the list shows.
 * @return The rows, at most `maxRows` of them.
 */
export function buildCompanyRows(
	providers: readonly StatsAiProvider[],
	maxRows: number
): LeaderboardRowInput[] {
	const unattributed = providers.find( provider => provider.name === AI_PROVIDER_UNKNOWN );
	const companies = providers.filter( provider => provider !== unattributed );
	const slots = maxRows - ( unattributed ? 1 : 0 );
	const folds = companies.length > slots;
	const rows = companies.slice( 0, folds ? slots - 1 : slots ).map( toCompanyRow );

	if ( folds ) {
		const rest = companies.slice( slots - 1 );
		rows.push( {
			id: 'other-companies',
			label: __( 'Other companies', 'jetpack-premium-analytics-pkg' ),
			value: rest.reduce( ( sum, provider ) => sum + provider.requests, 0 ),
			children: rest.map( toCompanyRow ),
		} );
	}

	if ( unattributed ) {
		rows.push( {
			...toCompanyRow( unattributed ),
			id: 'unattributed',
			label: __( 'Unattributed', 'jetpack-premium-analytics-pkg' ),
		} );
	}

	return rows;
}

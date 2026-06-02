/**
 * BranchSection — renders a group of branch cards with an optional search filter.
 *
 * @package
 */

import { SearchControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Stack, Text } from '@wordpress/ui';
import BranchRow from './branch-card';
import type { BranchCard as BranchCardType, PluginView } from '../api/types';

/**
 * Extract a GitHub PR number from a search query, so the feature-branch search
 * accepts a pasted pull-request URL or a bare PR number — not just branch text.
 *
 * Matches: `https://github.com/owner/repo/pull/12345` (with optional
 * trailing path/query/hash), `#12345`, or `12345`.
 *
 * @param query - The trimmed search query.
 * @return The PR number, or null if the query isn't a PR reference.
 */
const extractPrNumber = ( query: string ): number | null => {
	const urlMatch = query.match( /github\.com\/[^/]+\/[^/]+\/pull\/(\d+)/i );
	if ( urlMatch ) {
		return Number( urlMatch[ 1 ] );
	}
	const numMatch = query.match( /^#?(\d+)$/ );
	if ( numMatch ) {
		return Number( numMatch[ 1 ] );
	}
	return null;
};

type Props = {
	title: string;
	cards: BranchCardType[];
	searchable?: boolean;
	pluginSlug: string;
	onActivated: ( view: PluginView ) => void;
	searchPlaceholder?: string;
};

/**
 * Renders a labeled section of branch cards, with optional client-side search filtering.
 *
 * When `searchable` is true, a SearchControl is shown that filters cards by matching
 * the query (case-insensitive) against `pretty_version`, `branch`, and `version`,
 * and — for feature branches — by GitHub PR number or a pasted pull-request URL.
 *
 * @param {Props} props - Component props.
 * @return The branch section element, or null if there are no cards.
 */
const BranchSection = ( {
	title,
	cards,
	searchable = false,
	pluginSlug,
	onActivated,
	searchPlaceholder,
}: Props ) => {
	const [ query, setQuery ] = useState( '' );

	if ( cards.length === 0 ) {
		return null;
	}

	const trimmedQuery = query.trim();
	const hasQuery = trimmedQuery !== '';

	let filteredCards: BranchCardType[];
	if ( ! searchable ) {
		filteredCards = cards;
	} else if ( hasQuery ) {
		const q = trimmedQuery.toLowerCase();
		const prNumber = extractPrNumber( trimmedQuery );
		filteredCards = cards.filter(
			card =>
				( prNumber !== null && card.pr === prNumber ) ||
				( card.pretty_version?.toLowerCase().includes( q ) ?? false ) ||
				( card.branch?.toLowerCase().includes( q ) ?? false ) ||
				( card.version?.toLowerCase().includes( q ) ?? false )
		);
	} else {
		filteredCards = cards.filter( c => c.is_active );
	}

	return (
		<Stack direction="column" gap="sm">
			{ searchable && (
				<>
					<Text variant="heading-sm" render={ <h2 /> }>
						{ title }
					</Text>
					<SearchControl
						__nextHasNoMarginBottom
						label={ title }
						placeholder={ searchPlaceholder ?? __( 'Search', 'jetpack-beta' ) }
						value={ query }
						onChange={ setQuery }
					/>
				</>
			) }
			{ filteredCards.length > 0 && (
				<Card.Root className="jetpack-beta-list">
					{ filteredCards.map( card => (
						<BranchRow
							key={ `${ card.section }-${ card.source ?? '' }-${ card.id ?? '' }` }
							card={ card }
							title={ searchable ? undefined : title }
							pluginSlug={ pluginSlug }
							onActivated={ onActivated }
						/>
					) ) }
				</Card.Root>
			) }
			{ searchable && hasQuery && filteredCards.length === 0 && (
				<Text>{ __( 'No branches match your search.', 'jetpack-beta' ) }</Text>
			) }
		</Stack>
	);
};

export default BranchSection;

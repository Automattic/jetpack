/**
 * BranchSection — renders a group of branch cards with an optional search filter.
 *
 * @package
 */

import { SearchControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import BranchCard from './branch-card';
import type { BranchCard as BranchCardType, PluginView } from '../api/types';

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
 * the query (case-insensitive) against `pretty_version`, `branch`, and `version`.
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
		filteredCards = cards.filter(
			card =>
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
					<Text variant="heading-sm">{ title }</Text>
					<SearchControl
						__nextHasNoMarginBottom
						label={ title }
						placeholder={ searchPlaceholder ?? __( 'Search', 'jetpack-beta' ) }
						value={ query }
						onChange={ setQuery }
					/>
				</>
			) }
			{ filteredCards.map( card => (
				<BranchCard
					key={ `${ card.section }-${ card.source ?? '' }-${ card.id ?? '' }` }
					card={ card }
					title={ searchable ? undefined : title }
					pluginSlug={ pluginSlug }
					onActivated={ onActivated }
				/>
			) ) }
			{ searchable && hasQuery && filteredCards.length === 0 && (
				<Text>{ __( 'No branches match your search.', 'jetpack-beta' ) }</Text>
			) }
		</Stack>
	);
};

export default BranchSection;

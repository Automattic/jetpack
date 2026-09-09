import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import { ModuleItem } from '../more-features/module-item';
import { FeatureItem } from './feature-item';
import styles from './styles.module.scss';
import type { SearchResult } from './use-feature-search';

type SearchResultsProps = {
	results: SearchResult[];
	selected: string[];
	onSelect: ( slug: string, checked: boolean ) => void;
	onOpen: ( slug: string ) => void;
};

/**
 * One relevance-ranked list mixing features and modules.
 *
 * Searching drops the grouping entirely, the way the Products tab does: the best match
 * should lead regardless of which list it came from.
 *
 * @param {SearchResultsProps} props          - The component props.
 * @param {SearchResult[]}     props.results  - The ranked results.
 * @param {string[]}           props.selected - Slugs selected for a bulk action.
 * @param {Function}           props.onSelect - Called when a row's checkbox changes.
 * @param {Function}           props.onOpen   - Opens a feature's details.
 * @return The rendered component.
 */
export function SearchResults( { results, selected, onSelect, onOpen }: SearchResultsProps ) {
	if ( ! results.length ) {
		return (
			<h2 className={ styles[ 'search-heading' ] } role="status">
				{ __( 'No results found.', 'jetpack-my-jetpack' ) }
			</h2>
		);
	}

	return (
		<>
			<h2 className={ styles[ 'search-heading' ] } role="status">
				{ __( 'Search results', 'jetpack-my-jetpack' ) }
			</h2>

			<Stack direction="column" className={ styles[ 'feature-list' ] }>
				{ results.map( result =>
					result.kind === 'feature' ? (
						<FeatureItem
							key={ `feature:${ result.state.feature.slug }` }
							state={ result.state }
							selected={ selected.includes( result.state.feature.slug ) }
							onSelect={ onSelect }
							onOpen={ onOpen }
						/>
					) : (
						<ModuleItem
							key={ `module:${ result.module.module }` }
							module={ result.module }
							selected={ selected.includes( result.module.module ) }
							onSelect={ onSelect }
						/>
					)
				) }
			</Stack>
		</>
	);
}

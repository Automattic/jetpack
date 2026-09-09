import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import { ModuleItem } from '../more-features/module-item';
import { FeatureItem } from './feature-item';
import styles from './styles.module.scss';
import type { SearchResult } from './use-feature-search';

const noop = () => {};

type SearchResultsProps = {
	results: SearchResult[];
	onOpen: ( slug: string ) => void;
};

/**
 * One relevance-ranked list mixing features and modules.
 *
 * Searching drops the grouping entirely, the way the Products tab does: the best match
 * should lead regardless of which list it came from.
 *
 * Rows carry no checkbox: the bulk bar partitions over the feature list, so a module
 * picked out of results would silently do nothing.
 *
 * @param {SearchResultsProps} props         - The component props.
 * @param {SearchResult[]}     props.results - The ranked results.
 * @param {Function}           props.onOpen  - Opens a feature's details.
 * @return The rendered component.
 */
export function SearchResults( { results, onOpen }: SearchResultsProps ) {
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
							selected={ false }
							onSelect={ noop }
							onOpen={ onOpen }
							showCheckbox={ false }
						/>
					) : (
						<ModuleItem
							key={ `module:${ result.module.module }` }
							module={ result.module }
							selected={ false }
							onSelect={ noop }
							showCheckbox={ false }
						/>
					)
				) }
			</Stack>
		</>
	);
}

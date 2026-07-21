import { Flex } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect } from 'react';
import { ProductSection } from './product-section';
import { useProductFiltersContext } from './products-tracking-context';
import { SearchResultsList } from './search-results-list';
import { Skeleton } from './skeleton';
import styles from './styles.module.scss';
import { useFilteredProducts, UseFilteredProductsOptions } from './use-filtered-products';

export type FilteredProductsProps = UseFilteredProductsOptions;

/**
 * Render the filtered products component.
 *
 * @param {FilteredProductsProps} props - The component props.
 *
 * @return The rendered component.
 */
export function FilteredProducts( { search, selectedFilter }: FilteredProductsProps ) {
	const { sections, searchResults, isLoading } = useFilteredProducts( { search, selectedFilter } );
	const { trackEmptyResults } = useProductFiltersContext();

	const isSearching = Boolean( search?.trim() );
	const hasResults = isSearching ? searchResults.length > 0 : sections.length > 0;

	useEffect( () => {
		if ( ! hasResults && ! isLoading ) {
			let emptyStateType: 'search' | 'filter' | 'combined';

			if ( search && selectedFilter && selectedFilter !== 'all' ) {
				emptyStateType = 'combined';
			} else if ( search ) {
				emptyStateType = 'search';
			} else {
				emptyStateType = 'filter';
			}

			trackEmptyResults?.( {
				emptyStateType,
				searchTerm: search,
				activeFilter: selectedFilter || 'all',
			} );
		}
	}, [ hasResults, isLoading, search, selectedFilter, trackEmptyResults ] );

	if ( isLoading ) {
		return <Skeleton />;
	}

	// The `.product-section` class is what scopes the `.section-heading` style, so the
	// empty-state and search-results headings are wrapped in it to match the category headings.
	if ( ! hasResults ) {
		return (
			<Flex
				as="section"
				className={ styles[ 'product-section' ] }
				direction="column"
				expanded={ false }
			>
				<h2 className={ styles[ 'section-heading' ] } role="status">
					{ __( 'No results found.', 'jetpack-my-jetpack' ) }
				</h2>
			</Flex>
		);
	}

	// When searching, show a single relevance-ranked list of uniform rows instead of the
	// category-grouped product cards.
	if ( isSearching ) {
		return (
			<Flex
				as="section"
				className={ styles[ 'product-section' ] }
				direction="column"
				justify="start"
				gap={ 6 }
				expanded={ false }
			>
				<h2 className={ styles[ 'section-heading' ] } role="status">
					{ __( 'Search results', 'jetpack-my-jetpack' ) }
				</h2>
				<SearchResultsList items={ searchResults } />
			</Flex>
		);
	}

	return (
		<Flex gap={ 12 } direction="column">
			{ sections.map( section => (
				<ProductSection key={ section.id } section={ section } />
			) ) }
		</Flex>
	);
}

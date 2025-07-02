import { useCallback, useEffect, useRef, useState } from 'react';
import { FilteredPlans } from './filtered-plans';
import { FilteredProducts } from './filtered-products';
import { Filters } from './filters';
import { ProductFiltersProvider, useProductFiltersContext } from './products-tracking-context';
import styles from './styles.module.scss';
import { ProductFilter } from './types';

/**
 * Inner component that consumes the ProductFiltering context.
 *
 * @param {object}   root0                   - Properties of the component.
 * @param {object}   root0.selectedFilter    - The selected filter.
 * @param {Function} root0.setSelectedFilter - The function to set the selected filter.
 * @param {string}   root0.search            - The search term.
 * @param {Function} root0.setSearch         - The function to set the search term.
 * @return The rendered component.
 */
const ProductsContent = ( {
	selectedFilter,
	setSelectedFilter,
	search,
	setSearch,
}: {
	selectedFilter: ProductFilter;
	setSelectedFilter: ( filter: ProductFilter ) => void;
	search: string;
	setSearch: ( searchTerm: string ) => void;
} ) => {
	const searchTimeoutRef = useRef< NodeJS.Timeout | null >( null );
	const lastTrackedSearchRef = useRef( '' );

	const { trackFilterChange } = useProductFiltersContext();

	const handleFilterChange = useCallback(
		( newFilter: ProductFilter ) => {
			trackFilterChange( {
				filterType: 'category',
				previousFilter: selectedFilter,
				newFilter,
			} );
			setSelectedFilter( newFilter );
		},
		[ selectedFilter, trackFilterChange, setSelectedFilter ]
	);

	const handleSearchChange = useCallback(
		( searchTerm: string ) => {
			setSearch( searchTerm );

			// Clear previous timeout
			if ( searchTimeoutRef.current ) {
				clearTimeout( searchTimeoutRef.current );
			}

			// Set new timeout to track search after user stops typing (500ms)
			searchTimeoutRef.current = setTimeout( () => {
				if ( searchTerm !== lastTrackedSearchRef.current ) {
					trackFilterChange( {
						filterType: 'search',
						previousFilter: selectedFilter,
						newFilter: selectedFilter,
						searchTerm,
					} );
					lastTrackedSearchRef.current = searchTerm;
				}
			}, 500 );
		},
		[ selectedFilter, trackFilterChange, setSearch ]
	);

	// Cleanup timeout on unmount
	useEffect( () => {
		return () => {
			if ( searchTimeoutRef.current ) {
				clearTimeout( searchTimeoutRef.current );
			}
		};
	}, [] );

	return (
		<div className={ styles[ 'products-wrapper' ] }>
			<div className={ styles[ 'filters-wrapper' ] }>
				<Filters
					onChangeFilter={ handleFilterChange }
					onSearch={ handleSearchChange }
					search={ search }
					selectedFilter={ selectedFilter }
				/>
			</div>
			<div className={ styles[ 'filtered-products-wrapper' ] }>
				{ selectedFilter === 'included' ? (
					<FilteredPlans search={ search } />
				) : (
					<FilteredProducts search={ search } selectedFilter={ selectedFilter } />
				) }
			</div>
		</div>
	);
};

/**
 * Render the products with context provider.
 *
 * @return The rendered component.
 */
export const Products = () => {
	const [ selectedFilter, setSelectedFilter ] = useState< ProductFilter >( 'all' );
	const [ search, setSearch ] = useState< string >( '' );

	return (
		<ProductFiltersProvider currentFilter={ selectedFilter } searchTerm={ search }>
			<ProductsContent
				selectedFilter={ selectedFilter }
				setSelectedFilter={ setSelectedFilter }
				search={ search }
				setSearch={ setSearch }
			/>
		</ProductFiltersProvider>
	);
};

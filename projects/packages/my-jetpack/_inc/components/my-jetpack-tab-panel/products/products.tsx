import { useCallback, useEffect, useRef, useState } from 'react';
import { FilteredPlans } from './filtered-plans';
import { FilteredProducts } from './filtered-products';
import { Filters } from './filters';
import { ProductsTrackingProvider } from './products-tracking-context';
import styles from './styles.module.scss';
import { ProductFilter } from './types';
import { useProductsTracking } from './use-products-tracking';

/**
 * Render the products.
 *
 * @return The rendered component.
 */
export function Products() {
	const [ selectedFilter, setSelectedFilter ] = useState< ProductFilter >( 'all' );
	const [ search, setSearch ] = useState( '' );
	const searchTimeoutRef = useRef< NodeJS.Timeout | null >( null );
	const lastTrackedSearchRef = useRef( '' );

	const { trackFilterChange } = useProductsTracking( {
		currentFilter: selectedFilter,
		searchTerm: search,
	} );

	const handleFilterChange = useCallback(
		( newFilter: ProductFilter ) => {
			trackFilterChange( {
				filterType: 'category',
				previousFilter: selectedFilter,
				newFilter,
			} );
			setSelectedFilter( newFilter );
		},
		[ selectedFilter, trackFilterChange ]
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
		[ selectedFilter, trackFilterChange ]
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
		<ProductsTrackingProvider currentFilter={ selectedFilter } searchTerm={ search }>
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
		</ProductsTrackingProvider>
	);
}

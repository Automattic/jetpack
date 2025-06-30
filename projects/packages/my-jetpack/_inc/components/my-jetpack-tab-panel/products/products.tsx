import { useState } from 'react';
import { FilteredPlans } from './filtered-plans';
import { FilteredProducts } from './filtered-products';
import { Filters } from './filters';
import styles from './styles.module.scss';
import { ProductFilter } from './types';

/**
 * Render the products.
 *
 * @return The rendered component.
 */
export function Products() {
	const [ selectedFilter, setSelectedFilter ] = useState< ProductFilter >( 'all' );
	const [ search, setSearch ] = useState( '' );

	return (
		<div className={ styles[ 'products-wrapper' ] }>
			<div className={ styles[ 'filters-wrapper' ] }>
				<Filters
					onChangeFilter={ setSelectedFilter }
					onSearch={ setSearch }
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
}

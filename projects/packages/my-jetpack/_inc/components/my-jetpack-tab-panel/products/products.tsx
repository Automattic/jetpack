import { useState } from 'react';
import { FilteredProducts } from './filtered-products';
import { Filters } from './filters';
import styles from './styles.module.scss';

/**
 * Render the products.
 *
 * @return The rendered component.
 */
export function Products() {
	const [ selectedFilter, setSelectedFilter ] = useState( 'all' );
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
				<FilteredProducts search={ search } selectedFilter={ selectedFilter } />
			</div>
		</div>
	);
}

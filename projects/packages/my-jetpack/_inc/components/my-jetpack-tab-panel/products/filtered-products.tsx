import { Flex } from '@wordpress/components';
import { ProductSection } from './product-section';
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
	const filteredProducts = useFilteredProducts( { search, selectedFilter } );

	return (
		<Flex gap={ 12 } direction="column">
			{ filteredProducts.map( section => (
				<ProductSection key={ section.id } section={ section } />
			) ) }
		</Flex>
	);
}

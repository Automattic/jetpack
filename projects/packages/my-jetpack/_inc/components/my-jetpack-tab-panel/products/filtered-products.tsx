/* eslint-disable @wordpress/no-unsafe-wp-apis */
import { Flex, __experimentalText as Text } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
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

	if ( ! filteredProducts.length ) {
		return <Text size={ 20 }>{ __( 'No results found.', 'jetpack-my-jetpack' ) }</Text>;
	}

	return (
		<Flex gap={ 12 } direction="column">
			{ filteredProducts.map( section => (
				<ProductSection key={ section.id } section={ section } />
			) ) }
		</Flex>
	);
}

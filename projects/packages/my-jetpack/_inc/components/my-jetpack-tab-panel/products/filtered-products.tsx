/* eslint-disable @wordpress/no-unsafe-wp-apis */
import {
	Card,
	CardBody,
	CardHeader,
	Flex,
	ToggleControl,
	__experimentalVStack as VStack,
	__experimentalView as View,
} from '@wordpress/components';
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
		<div>
			{ filteredProducts.map( section => (
				<div key={ section.name }>
					<h2>{ section.title }</h2>
					<Flex as="ul" wrap>
						{ section.cards.map( card => (
							<li key={ card.product.slug }>
								<Card>
									<CardHeader>
										<h3>{ card.product.name }</h3>
									</CardHeader>
									<CardBody>{ card.product.description }</CardBody>
								</Card>
							</li>
						) ) }
					</Flex>
					<VStack as="ul">
						{ section.modules.map( m => (
							<View as="li" key={ m.slug }>
								<ToggleControl __nextHasNoMarginBottom checked={ m.activated } label={ m.name } />
							</View>
						) ) }
					</VStack>
				</div>
			) ) }
		</div>
	);
}

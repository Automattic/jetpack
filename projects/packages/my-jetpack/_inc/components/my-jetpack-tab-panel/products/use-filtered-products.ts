import useProducts from '../../../data/products/use-products';
import { CATEGORY_CARDS_AND_MODULES } from './mappings';
import { JetpackProductWithCard, ProductSection } from './types';
import { useAllJetpackModules } from './use-all-jetpack-modules';
import { filterSections, getSectionTitle } from './utils';

export type UseFilteredProductsOptions = {
	selectedFilter: string | undefined;
	search: string | undefined;
};

/**
 * Custom hook to filter products based on search term and selected filter.
 *
 * @param {UseFilteredProductsOptions} options - The options for filtering products.
 *
 * @return An array of sections and the corresponding cards and modules
 */
export function useFilteredProducts( {
	search,
	selectedFilter,
}: UseFilteredProductsOptions ): Array< ProductSection > {
	let sections = Object.entries( CATEGORY_CARDS_AND_MODULES );

	if ( CATEGORY_CARDS_AND_MODULES[ selectedFilter ] ) {
		sections = sections.filter( ( [ category ] ) => category === selectedFilter );
	}

	const productSlugs = sections.reduce< Array< JetpackProductWithCard > >(
		( acc, [ , { cards } ] ) => {
			return [ ...acc, ...cards ];
		},
		[]
	);

	const { products } = useProducts( productSlugs );
	const allModules = useAllJetpackModules();

	const productsBySlug = products.reduce(
		( acc, product ) => {
			return {
				...acc,
				[ product.slug ]: product,
			};
		},
		{} as Record< JetpackProductWithCard, ( typeof products )[ number ] >
	);

	return filterSections(
		sections.map( ( [ category, { cards, modules } ] ) => ( {
			id: category,
			title: getSectionTitle( category ),
			cards: cards
				.map( slug => {
					const product = productsBySlug[ slug ];
					if ( ! product ) {
						return null;
					}
					return {
						product,
						module: allModules[ slug ],
					};
				} )
				.filter( Boolean ),
			modules: modules.map( slug => allModules[ slug ] ).filter( Boolean ),
		} ) ),
		{ search }
	);
}

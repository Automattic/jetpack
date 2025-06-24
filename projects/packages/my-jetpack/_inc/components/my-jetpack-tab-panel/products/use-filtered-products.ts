import { useMemo } from 'react';
import useProducts from '../../../data/products/use-products';
import { CATEGORY_CARDS_AND_MODULES, PRODUCT_MODULES } from './mappings';
import { JetpackProductWithCard } from './types';
import { useAllJetpackModules } from './use-all-jetpack-modules';
import { filterAndSortModules, filterSections, getSectionTitle } from './utils';

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
export function useFilteredProducts( { search, selectedFilter }: UseFilteredProductsOptions ) {
	// Let us default to all the sections by default.
	let sections = Object.entries( CATEGORY_CARDS_AND_MODULES );

	// If a known filter is selected, we filter the sections accordingly, which means that we show the section/products based on the selected filter/category.
	if ( CATEGORY_CARDS_AND_MODULES[ selectedFilter ] ) {
		sections = sections.filter( ( [ category ] ) => category === selectedFilter );
	} else {
		// Since were defaulting to all categories, we can filter out the 'recommended' category.
		sections = sections.filter( ( [ category ] ) => category !== 'recommended' );
	}

	// Let us extract the product slugs from the sections, based on the cards in the section, because we want to display product cards accordingly.
	const productSlugs = sections.reduce< Array< JetpackProductWithCard > >(
		( acc, [ , { cards } ] ) => {
			return [ ...acc, ...cards ];
		},
		[]
	);

	const { products } = useProducts( productSlugs );
	const { modules: allModules, isLoading: isLoadingModules } = useAllJetpackModules();

	// Let us create a mapping of products by their slug for easy access.
	const productsBySlug = products.reduce(
		( acc, product ) => {
			return {
				...acc,
				[ product.slug ]: product,
			};
		},
		{} as Record< JetpackProductWithCard, ( typeof products )[ number ] >
	);

	const $sections = filterSections(
		sections.map( ( [ category, { cards, modules } ] ) => ( {
			id: category,
			title: getSectionTitle( category ),
			cards: cards
				.map( slug => {
					const product = productsBySlug[ slug ];
					if ( ! product ) {
						return null;
					}
					const moduleSlug = PRODUCT_MODULES[ slug ] || slug;

					return {
						product,
						module: allModules[ moduleSlug ],
					};
				} )
				.filter( Boolean ),
			modules: filterAndSortModules( modules.map( slug => allModules[ slug ] ) ),
		} ) ),
		{ search }
	);

	return useMemo(
		() => ( {
			sections: $sections,
			isLoading: isLoadingModules,
		} ),
		[ $sections, isLoadingModules ]
	);
}

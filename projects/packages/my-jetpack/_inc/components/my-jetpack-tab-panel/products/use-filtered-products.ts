import { useMemo } from 'react';
import { useAllProducts } from '../../../data/products/use-all-products';
import { CATEGORY_CARDS_AND_MODULES, PRODUCT_MODULES } from './mappings';
import { ProductFilter } from './types';
import { useAllJetpackModules } from './use-all-jetpack-modules';
import { buildCards, filterAndSortModules, getSectionTitle, searchAndRankItems } from './utils';

const ALL_CATEGORIES = Object.entries( CATEGORY_CARDS_AND_MODULES );

export type UseFilteredProductsOptions = {
	selectedFilter: ProductFilter | undefined;
	search: string | undefined;
};

/**
 * Record that an item (by slug) belongs to a category label.
 *
 * @param {Map<string, string[]>} map   - The slug-to-category-labels map to update.
 * @param {string}                slug  - The item slug.
 * @param {string | undefined}    label - The category label.
 */
function addCategory( map: Map< string, string[] >, slug: string, label: string | undefined ) {
	if ( ! label ) {
		return;
	}
	const labels = map.get( slug ) ?? [];
	if ( ! labels.includes( label ) ) {
		labels.push( label );
		map.set( slug, labels );
	}
}

/**
 * Custom hook to filter products based on search term and selected filter.
 *
 * @param {UseFilteredProductsOptions} options - The options for filtering products.
 *
 * @return An array of sections and the corresponding cards and modules
 */
export function useFilteredProducts( { search, selectedFilter }: UseFilteredProductsOptions ) {
	const { data: allProducts } = useAllProducts();
	const { modules: allModules, isLoading: isLoadingModules } = useAllJetpackModules();

	// Build every category's cards and modules up front so search can always scan every
	// product/module regardless of the selected category filter.
	const allSections = useMemo(
		() =>
			ALL_CATEGORIES.map( ( [ category, { cards, modules } ] ) => ( {
				id: category,
				title: getSectionTitle( category ),
				cards: buildCards( cards, allProducts, allModules, PRODUCT_MODULES ),
				modules: filterAndSortModules( modules.map( slug => allModules[ slug ] ) ),
			} ) ),
		[ allProducts, allModules ]
	);

	// The browse view honors the selected category filter; the default 'all' view hides the
	// 'recommended' category (it is reachable via its own filter and would duplicate cards).
	const sections = useMemo(
		() =>
			allSections.filter( ( { id } ) =>
				CATEGORY_CARDS_AND_MODULES[ selectedFilter ] ? id === selectedFilter : id !== 'recommended'
			),
		[ allSections, selectedFilter ]
	);

	// Map each card/module to the category labels it belongs to, so searching a category name
	// (e.g. "security", "growth", "performance") surfaces every item in that category.
	const { cardCategories, moduleCategories } = useMemo( () => {
		const cards = new Map< string, string[] >();
		const modules = new Map< string, string[] >();
		allSections.forEach( section => {
			section.cards.forEach( ( { product } ) => addCategory( cards, product.slug, section.title ) );
			section.modules.forEach( module => addCategory( modules, module.module, section.title ) );
		} );
		return { cardCategories: cards, moduleCategories: modules };
	}, [ allSections ] );

	// Search always scans every category and ranks results into a single uniform list; browse
	// (no search term) keeps the category grouping above.
	const searchResults = useMemo(
		() =>
			searchAndRankItems(
				allSections.flatMap( section => section.cards ),
				allSections.flatMap( section => section.modules ),
				search,
				{ cardCategories, moduleCategories }
			),
		[ allSections, cardCategories, moduleCategories, search ]
	);

	return useMemo(
		() => ( {
			sections,
			searchResults,
			isLoading: isLoadingModules,
		} ),
		[ sections, searchResults, isLoadingModules ]
	);
}

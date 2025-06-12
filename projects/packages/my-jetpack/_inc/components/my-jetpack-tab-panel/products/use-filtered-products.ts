import { store as modulesStore } from '@automattic/jetpack-shared-extension-utils';
import { useSelect } from '@wordpress/data';
import useProducts from '../../../data/products/use-products';
import { CATEGORY_CARDS_AND_MODULES } from './mappings';
import { JetpackProductWithCard } from './types';
import { getSectionTitle } from './utils';

export type UseFilteredProductsOptions = {
	selectedFilter?: string;
	search?: string;
};

/**
 * Custom hook to filter products based on search term and selected filter.
 *
 * @param {UseFilteredProductsOptions} options - The options for filtering products.
 *
 * @return An array of sections and the corresponding cards and modules
 */
export function useFilteredProducts( { search, selectedFilter }: UseFilteredProductsOptions ) {
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
	const allModules = useSelect( select => select( modulesStore ).getJetpackModules(), [] );

	const productsBySlug = products.reduce(
		( acc, product ) => {
			return {
				...acc,
				[ product.slug ]: product,
			};
		},
		{} as Record< JetpackProductWithCard, ( typeof products )[ number ] >
	);

	return sections
		.map( ( [ category, { cards, modules } ] ) => ( {
			name: category,
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
				.filter( Boolean )
				// TODO Improve search
				.filter( item => {
					if ( ! search ) {
						return true;
					}

					const { product, module: m } = item;

					const str = JSON.stringify( Object.values( { ...product, ...m } ) );

					return str.toLowerCase().includes( search.toLowerCase() );
				} ),
			modules: modules
				.map( slug => {
					const $module = allModules[ slug ];

					if ( ! $module ) {
						return null;
					}

					return {
						slug: $module.module,
						name: $module.name,
						activated: $module.activated,
						available: $module.available,
						description: $module.description,
						long_description: $module.long_description,
						search_terms: $module.search_terms,
					};
				} )
				.filter( Boolean )
				// TODO Improve search
				.filter( item => {
					if ( ! search ) {
						return true;
					}

					const str = JSON.stringify( Object.values( item ) );

					return str.toLowerCase().includes( search.toLowerCase() );
				} ),
		} ) )
		.filter( section => {
			return section.cards.length || section.modules.length;
		} );
}

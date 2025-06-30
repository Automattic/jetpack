import { __ } from '@wordpress/i18n';
import { QUERY_PURCHASES_KEY, REST_API_SITE_PURCHASES_ENDPOINT } from '../../../data/constants';
import { useAllProducts } from '../../../data/products/use-all-products';
import { WP_Error } from '../../../data/types';
import useSimpleQuery from '../../../data/use-simple-query';
import { JETPACK_NON_PAID_MODULES, JETPACK_PRODUCTS_WITH_CARD } from './constants';
import { PRODUCT_MODULES } from './mappings';
import { JetpackProductWithCard, ProductSection } from './types';
import { useAllJetpackModules } from './use-all-jetpack-modules';
import { filterAndSortModules, filterSections } from './utils';

export type UseFilteredPlansOptions = {
	search: string | undefined;
};

/**
 * Custom hook to filter plans based on search term.
 *
 * @param {UseFilteredPlansOptions} options - The options for filtering plans.
 *
 * @return An array of sections and the corresponding cards and modules
 */
export function useFilteredPlans( { search }: UseFilteredPlansOptions ): {
	plans: Array< ProductSection >;
	isLoading: boolean;
	errorPlans: WP_Error;
} {
	const {
		data: purchases,
		isLoading: isLoadingPlans,
		error: errorPlans,
	} = useSimpleQuery< Purchase[] >( {
		name: QUERY_PURCHASES_KEY,
		query: { path: REST_API_SITE_PURCHASES_ENDPOINT },
	} );

	const { data: products } = useAllProducts();

	const { modules: allModules, isLoading: isLoadingModules } = useAllJetpackModules();

	const list = ( purchases || [] ).map< ProductSection >( purchase => {
		const $products = Object.entries( products || {} ).filter(
			( [ slug, item ] ) =>
				JETPACK_PRODUCTS_WITH_CARD.includes( slug as JetpackProductWithCard ) &&
				item.relatedPlanSlugs.includes( purchase.product_slug )
		);

		return {
			id: purchase.ID,
			title: purchase.product_name,
			cards: $products.map( ( [ slug, product ] ) => {
				const moduleSlug = PRODUCT_MODULES[ slug ] || slug;

				return {
					product,
					module: allModules[ moduleSlug ],
				};
			} ),
		};
	} );

	list.push( {
		id: 'free',
		title: __( 'Free', 'jetpack-my-jetpack' ),
		modules: filterAndSortModules( JETPACK_NON_PAID_MODULES.map( slug => allModules[ slug ] ) ),
	} );

	return {
		plans: filterSections( list, { search } ),
		isLoading: isLoadingPlans || isLoadingModules,
		errorPlans,
	};
}

import { useCallback } from 'react';
import { ProductCamelCase } from '../../../data/types';
import useAnalytics from '../../../hooks/use-analytics';
import { MyJetpackModule } from '../../types';
import { ProductFilter } from './types';

export type ProductActionType = 'activate' | 'deactivate' | 'learn_more';
export type ProductType = 'product' | 'module';

/**
 * Custom hook for tracking Products tab interactions.
 *
 * @param {object}        context               - Current context of the Products tab
 * @param {ProductFilter} context.currentFilter - Currently selected filter
 * @param {string}        context.searchTerm    - Current search term (if any)
 *
 * @return Object with tracking functions
 */
export function useProductsTracking( context: {
	currentFilter: ProductFilter;
	searchTerm?: string;
} ) {
	const { recordEvent } = useAnalytics();
	const { currentFilter, searchTerm } = context;

	/**
	 * Track filter changes in the Products tab.
	 *
	 * @param {object}                params                - Filter tracking parameters
	 * @param {'category' | 'search'} params.filterType     - Type of filter change
	 * @param {ProductFilter}         params.previousFilter - Previous filter value
	 * @param {ProductFilter}         params.newFilter      - New filter value
	 * @param {string}                params.searchTerm     - Search term (for search filter type)
	 */
	const trackFilterChange = useCallback(
		( params: {
			filterType: 'category' | 'search';
			previousFilter: ProductFilter;
			newFilter: ProductFilter;
			searchTerm?: string;
		} ) => {
			recordEvent( 'jetpack_myjetpack_products_filter_change', {
				filter_type: params.filterType,
				previous_filter: params.previousFilter,
				new_filter: params.newFilter,
				search_term: params.searchTerm || '',
			} );
		},
		[ recordEvent ]
	);

	/**
	 * Track product or module actions (activate/deactivate/learn more).
	 *
	 * @param {object}                             params               - Product action tracking parameters
	 * @param {ProductActionType}                  params.action        - The action performed
	 * @param {string}                             params.productSlug   - Product or module slug
	 * @param {ProductType}                        params.productType   - Whether it's a product or module
	 * @param {string}                             params.productStatus - Current status before action
	 * @param {ProductCamelCase | MyJetpackModule} params.productData   - Full product/module data
	 */
	const trackProductAction = useCallback(
		( params: {
			action: ProductActionType;
			productSlug: string;
			productType: ProductType;
			productStatus: string;
			productData: ProductCamelCase | MyJetpackModule;
		} ) => {
			const productName = 'name' in params.productData ? params.productData.name : '';

			recordEvent( 'jetpack_myjetpack_product_action', {
				action: params.action,
				product_slug: params.productSlug,
				product_name: productName,
				product_type: params.productType,
				product_status: params.productStatus,
				current_filter: currentFilter,
				search_term: searchTerm || '',
			} );
		},
		[ recordEvent, currentFilter, searchTerm ]
	);

	return {
		trackFilterChange,
		trackProductAction,
	};
}

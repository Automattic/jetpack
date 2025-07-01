import { createContext, useCallback, useContext } from 'react';
import { ProductCamelCase } from '../../../data/types';
import useAnalytics from '../../../hooks/use-analytics';
import { MyJetpackModule } from '../../types';
import { ProductFilter } from './types';

export type ProductActionType = 'activate' | 'deactivate' | 'learn_more';
export type ProductType = 'product' | 'module';

type ProductFiltersContextType = {
	trackFilterChange: ( params: {
		filterType: 'category' | 'search';
		previousFilter: ProductFilter;
		newFilter: ProductFilter;
		searchTerm?: string;
	} ) => void;
	trackProductAction: ( params: {
		action: ProductActionType;
		productSlug: string;
		productType: ProductType;
		productStatus: string;
		productData: ProductCamelCase | MyJetpackModule;
	} ) => void;
} | null;

const ProductFiltersContext = createContext< ProductFiltersContextType >( null );

export type ProductFiltersProviderProps = {
	children: React.ReactNode;
	currentFilter: ProductFilter;
	searchTerm?: string;
};

/**
 * Provider component that makes Products filters and tracking context available to child components.
 *
 * @param {ProductFiltersProviderProps} props - The provider props
 *
 * @return The provider component
 */
export const ProductFiltersProvider = ( {
	children,
	currentFilter,
	searchTerm,
}: ProductFiltersProviderProps ) => {
	const { recordEvent } = useAnalytics();

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

	const contextValue = {
		trackFilterChange,
		trackProductAction,
	};

	return (
		<ProductFiltersContext.Provider value={ contextValue }>
			{ children }
		</ProductFiltersContext.Provider>
	);
};

/**
 * Hook to access the Product filters context.
 * Returns null if used outside a ProductFiltersProvider.
 *
 * @return The filters context or null if not available
 */
export const useProductFiltersContext = () => {
	return useContext( ProductFiltersContext );
};

import { createContext, useCallback, useContext } from 'react';
import { ProductCamelCase } from '../../../data/types';
import useAnalytics from '../../../hooks/use-analytics';
import { MyJetpackModule } from '../../types';
import { ProductFilter } from './types';

export type ProductActionType = 'activate' | 'deactivate' | 'learn_more';
export type ProductType = 'product' | 'module';

type ProductFilteringContextType = {
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

const ProductFilteringContext = createContext< ProductFilteringContextType >( null );

export type ProductFilteringProviderProps = {
	children: React.ReactNode;
	currentFilter: ProductFilter;
	searchTerm?: string;
};

/**
 * Provider component that makes Products filtering and tracking context available to child components.
 *
 * @param {ProductFilteringProviderProps} props - The provider props
 *
 * @return The provider component
 */
export const ProductFilteringProvider = ( {
	children,
	currentFilter,
	searchTerm,
}: ProductFilteringProviderProps ) => {
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
		<ProductFilteringContext.Provider value={ contextValue }>
			{ children }
		</ProductFilteringContext.Provider>
	);
};

/**
 * Hook to access the Product filtering context.
 * Returns null if used outside a ProductFilteringProvider.
 *
 * @return The filtering context or null if not available
 */
export const useProductFilteringContext = () => {
	return useContext( ProductFilteringContext );
};

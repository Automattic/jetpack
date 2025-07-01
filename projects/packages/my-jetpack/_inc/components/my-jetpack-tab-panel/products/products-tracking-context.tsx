import { createContext, useContext } from 'react';
import { ProductFilter } from './types';
import { useProductsTracking } from './use-products-tracking';

type ProductsTrackingContextType = ReturnType< typeof useProductsTracking > | null;

const ProductsTrackingContext = createContext< ProductsTrackingContextType >( null );

export type ProductsTrackingProviderProps = {
	children: React.ReactNode;
	currentFilter: ProductFilter;
	searchTerm?: string;
};

/**
 * Provider component that makes Products tracking context available to child components.
 *
 * @param {ProductsTrackingProviderProps} props - The provider props
 *
 * @return The provider component
 */
export function ProductsTrackingProvider( {
	children,
	currentFilter,
	searchTerm,
}: ProductsTrackingProviderProps ) {
	const tracking = useProductsTracking( { currentFilter, searchTerm } );

	return (
		<ProductsTrackingContext.Provider value={ tracking }>
			{ children }
		</ProductsTrackingContext.Provider>
	);
}

/**
 * Hook to access the Products tracking context.
 *
 * @return The tracking context or throws error if used outside provider
 */
export function useProductsTrackingContext() {
	const context = useContext( ProductsTrackingContext );
	if ( ! context ) {
		throw new Error( 'useProductsTrackingContext must be used within a ProductsTrackingProvider' );
	}
	return context;
}

/**
 * Hook to optionally access the Products tracking context.
 * Returns null if used outside a ProductsTrackingProvider.
 *
 * @return The tracking context or null if not available
 */
export function useOptionalProductsTrackingContext() {
	return useContext( ProductsTrackingContext );
}
